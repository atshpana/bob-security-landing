/** BOB 4.0 §11 — deterministic pre-DB business rules. Monetary values are minor units (integer).
 * This module never creates actual payments or commissions on a scan/install/trial.
 */
export const COMMISSION_STATES=Object.freeze(["PENDING","EARNED","APPROVED","PAID","REJECTED","REFUNDED","REVERSED"]);
export const BRANCH_STATES=Object.freeze(["DRAFT","PENDING_VERIFICATION","ACTIVE","SUSPENDED"]);
export const QR_STATES=Object.freeze(["ACTIVE","SUSPENDED","EXPIRED","EXHAUSTED"]);
export const ALLOWED_CHANNELS=Object.freeze(["PRIMARY_DISTRIBUTOR","RETAIL_BRANCH","STORE","CAMPAIGN","SALES_STAFF","PARTNER","ONLINE","FIELD"]);
export const CAPTURE_WINDOW_MS=30*24*60*60*1000;
export const ELIGIBILITY_WINDOW_MS=168*60*60*1000;
export function validateDistributorCreation(input,role){
 if(role!=="BOB_DISTRIBUTOR_ADMIN") throw Error("ADMIN_ONLY");
 if(input.commissionPercent!==undefined&&input.commissionPercent!==null&&input.commissionPercent!=="") throw Error("RATE_MUST_START_EMPTY");
 if(input.selfRegistration) throw Error("NO_SELF_REGISTRATION");
 return {status:"DRAFT",commissionPercent:null};
}
export function validateCommissionPolicy(input,role){
 if(role!=="BOB_FINANCE_AUTHORIZED") throw Error("FINANCE_AUTH_REQUIRED");
 if(typeof input.percent!=="number"||!Number.isFinite(input.percent)||input.percent<0||input.percent>100)throw Error("INVALID_PERCENT");
 if(!input.effectiveAt||!input.version||!input.approvalId)throw Error("POLICY_APPROVAL_REQUIRED");
 return true;
}
export function validateBranchShare(parentPercent,branchPercent){
 if(!Number.isFinite(parentPercent)||!Number.isFinite(branchPercent)||parentPercent<0||branchPercent<0||branchPercent>parentPercent)throw Error("BRANCH_SHARE_EXCEEDS_PARENT");
 return {parentNetPercent:parentPercent-branchPercent,branchPercent,totalPercent:parentPercent};
}
export function validateBranchDirectPayout(branch){
 if(branch.status!=="ACTIVE"||!branch.identityVerified||!branch.payoutOwnershipVerified||!branch.legalTaxVerified||!branch.bobApproved)throw Error("DIRECT_PAYOUT_NOT_VERIFIED");
 return true;
}
export function attributionDecision({firstValidScanAt,lockAt,alreadyAttributed=false,hasPriorQualifiedPurchase=false,serverVerified=false}){
 if(!serverVerified) return {allow:false,reason:"SERVER_VERIFICATION_REQUIRED"};
 if(alreadyAttributed||hasPriorQualifiedPurchase)return {allow:false,reason:"ATTRIBUTION_LOCKED"};
 if(!Number.isFinite(firstValidScanAt)||!Number.isFinite(lockAt)||lockAt<firstValidScanAt||lockAt-firstValidScanAt>CAPTURE_WINDOW_MS)return {allow:false,reason:"CAPTURE_WINDOW_EXPIRED"};
 return {allow:true,reason:"FIRST_VALID_REFERRAL"};
}
export function eligibleFirstCollection({lockAt,collectionAt,firstQualifiedCollection,trialStartedAt=null,sameOfficialSubscriptionChain=false,previousCommission=false,attributionLocked=true}){
 if(!attributionLocked||previousCommission||!firstQualifiedCollection||!Number.isFinite(lockAt)||!Number.isFinite(collectionAt)||collectionAt<lockAt)return false;
 if(collectionAt-lockAt<=ELIGIBILITY_WINDOW_MS)return true;
 return Number.isFinite(trialStartedAt)&&trialStartedAt>=lockAt&&trialStartedAt-lockAt<=ELIGIBILITY_WINDOW_MS&&sameOfficialSubscriptionChain;
}
export function commissionTrigger(event){
 if(!event.serverVerified||!event.officialPaymentConfirmed||!event.firstQualifiedCollection||!event.attributionLocked||event.previousCommission||!eligibleFirstCollection(event))return {created:false,reason:"NOT_ELIGIBLE"};
 return {created:true,state:"PENDING",reason:"FIRST_ELIGIBLE_COLLECTION"};
}
export function commissionSplitMinorUnits({basisMinor,parentPercent,branchPercent=0}){
 if(!Number.isSafeInteger(basisMinor)||basisMinor<0)throw Error("INVALID_BASIS");
 validateBranchShare(parentPercent,branchPercent);
 // Fixed-point calculation avoids binary rounding artifacts for percentages to 4 decimals.
 const scale=10000n;
 const rate=(n)=>{if(!Number.isFinite(n)||Math.round(n*10000)!==n*10000)throw Error("PERCENT_PRECISION_EXCEEDED");return BigInt(Math.round(n*10000));};
 const ceil=(a,b)=>(a+b-1n)/b;
 const denom=100n*scale;
 const base=BigInt(basisMinor);
 const branch=ceil(base*rate(branchPercent),denom);
 const parent=ceil(base*rate(parentPercent-branchPercent),denom);
 const gross=ceil(base*rate(parentPercent),denom);
 return {parentMinor:Number(parent),branchMinor:Number(branch),grossMinor:Number(gross),roundingDifferenceMinor:Number(parent+branch-gross),roundingPolicy:"CEIL_TO_MINOR_UNIT_V1"};
}
export function transitionCommission(current,next,{officialEvidence=false,financeApproved=false,payoutEvidence=false}={}){
 const edges={PENDING:["EARNED","REJECTED"],EARNED:["APPROVED","REJECTED"],APPROVED:["PAID"],PAID:[]};
 if(!edges[current]?.includes(next))throw Error("INVALID_COMMISSION_TRANSITION");
 if(next==="EARNED"&&!officialEvidence)throw Error("OFFICIAL_EVIDENCE_REQUIRED");
 if(next==="APPROVED"&&!financeApproved)throw Error("FINANCE_APPROVAL_REQUIRED");
 if(next==="PAID"&&!payoutEvidence)throw Error("PAYOUT_PROOF_REQUIRED");
 return next;
}
export function validateAttributionCorrection({approvers,reason,evidence}){
 if(!reason||!evidence||!Array.isArray(approvers)||new Set(approvers).size<2)throw Error("TWO_INDEPENDENT_APPROVALS_REQUIRED");
 return true;
}
