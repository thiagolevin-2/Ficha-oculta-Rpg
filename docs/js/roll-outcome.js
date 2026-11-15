// Texto do resultado de uma rolagem. No Ordem Paranormal não existe "falha automática" no 1 natural:
// o crítico acontece quando o dado escolhido alcança a margem de ameaça da arma.
export function rollOutcome({natural=null,total=0,dc=null,kind='free',criticalThreshold=20}={}){
 const compared=Number.isFinite(dc)&&dc>=1;
 if(kind==='attack'&&natural!==null&&natural>=criticalThreshold)return {tone:'critical',label:'CRÍTICO',success:true,natural,compared};
 if(compared)return {tone:total>=dc?'success':'failure',label:total>=dc?'SUCESSO':'FALHA',success:total>=dc,natural,compared};
 return {tone:natural===20?'natural20':'neutral',label:kind==='attack'?'ATAQUE':natural===20?'20 NO DADO':'RESULTADO',success:null,natural,compared:false};
}
