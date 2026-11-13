const $=id=>document.getElementById(id);
const COLORS=["#159b72","#5795d8","#8874d6","#e5a34b","#e16c72","#48a6ad","#8b9b62","#b17ca8","#8290a0"];
const CATEGORIES={expense:["Food & dining","Transport","Shopping","Bills & utilities","Housing","Health","Education","Entertainment","Travel","Groceries","Personal care","Other"],income:["Salary","Freelance","Business","Investment","Gift","Other"]};
const money=n=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:2}).format(Number(n)||0);
const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`};
const monthNow=()=>today().slice(0,7);
let transactions=[],budgets={},toastTimer;
try{transactions=JSON.parse(localStorage.getItem("pennywise_transactions")||"[]");budgets=JSON.parse(localStorage.getItem("pennywise_budgets")||"{}")}catch(e){transactions=[];budgets={}}
if(!Array.isArray(transactions))transactions=[];
let selectedMonth=monthNow();
$("monthPicker").value=selectedMonth;
function save(){localStorage.setItem("pennywise_transactions",JSON.stringify(transactions));localStorage.setItem("pennywise_budgets",JSON.stringify(budgets))}
function monthItems(){return transactions.filter(t=>t.date&&t.date.slice(0,7)===selectedMonth)}
function toast(msg){const el=$("toast");el.textContent=msg;el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),2400)}
function updateCategoryOptions(type,selected){const select=$("category");select.innerHTML=CATEGORIES[type].map(c=>`<option>${c}</option>`).join("");if(selected&&CATEGORIES[type].includes(selected))select.value=selected}
function render(){
 const items=monthItems(),income=items.filter(t=>t.type==="income").reduce((s,t)=>s+t.amount,0),expenses=items.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0),balance=income-expenses;
 $("incomeTotal").textContent=money(income);$("expenseTotal").textContent=money(expenses);$("balanceTotal").textContent=money(balance);$("balanceTotal").style.color=balance<0?"#df7078":"#172235";$("savingsRate").textContent=income?`${Math.round(balance/income*100)}%`:"0%";
 $("donutTotal").textContent=money(expenses);$("spendCount").textContent=`${items.filter(t=>t.type==="expense").length} expenses`;
 const groups={};items.filter(t=>t.type==="expense").forEach(t=>groups[t.category]=(groups[t.category]||0)+t.amount);
 const sorted=Object.entries(groups).sort((a,b)=>b[1]-a[1]);let offset=0;const total=expenses;
 const stops=sorted.map(([cat,val],i)=>{const start=offset;offset+=total?val/total*100:0;return `${COLORS[i%COLORS.length]} ${start}% ${offset}%`});
 $("donut").style.background=total?`conic-gradient(${stops.join(",")})`:"conic-gradient(#e9edf2 0 100%)";
 $("legend").innerHTML=sorted.length?sorted.slice(0,7).map(([cat,val],i)=>`<div class="legend-row"><i class="legend-dot" style="background:${COLORS[i%COLORS.length]}"></i><span>${esc(cat)}</span><strong>${money(val)}</strong></div>`).join(""):`<div class="empty">Add expenses to see your breakdown.</div>`;
 const budget=Number(budgets[selectedMonth]||0),pct=budget?Math.min(expenses/budget*100,100):0;
 $("budgetAmount").textContent=budget?money(budget):"Not set";$("budgetProgress").style.width=pct+"%";$("budgetProgress").style.background=expenses>budget&&budget?"#e16c72":"#159b72";$("budgetSpent").textContent=`${money(expenses)} spent`;
 $("budgetRemaining").textContent=budget?(expenses>budget?`${money(expenses-budget)} over budget`:`${money(budget-expenses)} remaining`):"Set a budget to track";
 $("budgetTip").textContent=!budget?"A budget gives every rupee a purpose. Set one to get started.":expenses>budget?"You have crossed your monthly budget. Review your spending to get back on track.":pct>80?"You're getting close to your budget limit. Keep an eye on the rest of the month.":"You're within your budget. Keep up the good work!";
 const search=$("searchInput").value.trim().toLowerCase(),tf=$("typeFilter").value,cf=$("categoryFilter").value;
 const filtered=items.filter(t=>(tf==="all"||t.type===tf)&&(cf==="all"||t.category===cf)&&(!search||`${t.title} ${t.category} ${t.notes||""}`.toLowerCase().includes(search))).sort((a,b)=>b.date.localeCompare(a.date)||b.id-a.id);
 $("transactionRows").innerHTML=filtered.length?filtered.map(t=>`<tr><td>${esc(t.title)}${t.notes?`<div style="font-size:9px;color:#9aa4b1;font-weight:400;margin-top:3px">${esc(t.notes)}</div>`:""}</td><td>${esc(t.category)}</td><td>${formatDate(t.date)}</td><td><span class="type-tag ${t.type}">${t.type}</span></td><td class="amount ${t.type}">${t.type==="income"?"+":"−"}${money(t.amount)}</td><td><div class="row-actions"><button class="icon-btn" data-edit="${t.id}" aria-label="Edit">✎</button><button class="icon-btn" data-delete="${t.id}" aria-label="Delete">×</button></div></td></tr>`).join(""):`<tr><td colspan="6" class="empty">No matching transactions found.</td></tr>`;
 $("resultCount").textContent=`${filtered.length} transaction${filtered.length===1?"":"s"}`;
 const cats=[...new Set(items.map(t=>t.category))].sort(),old=$("categoryFilter").value;$("categoryFilter").innerHTML='<option value="all">All categories</option>'+cats.map(c=>`<option>${esc(c)}</option>`).join("");$("categoryFilter").value=cats.includes(old)?old:"all";
}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function formatDate(s){const [y,m,d]=s.split("-");return `${d}/${m}/${y}`}
function openTransaction(t){$("transactionForm").reset();$("editId").value=t?.id||"";$("formTitle").textContent=t?"Edit transaction":"Add transaction";$("date").value=t?.date||today();$("title").value=t?.title||"";$("amount").value=t?.amount??"";$("notes").value=t?.notes||"";document.querySelector(`input[name="type"][value="${t?.type||"expense"}"]`).checked=true;updateCategoryOptions(t?.type||"expense",t?.category);$("transactionDialog").showModal()}
function closeTransaction(){$("transactionDialog").close()}
["addTop","addInline"].forEach(id=>$(id).addEventListener("click",()=>openTransaction()));
$("closeTransaction").onclick=closeTransaction;$("cancelTransaction").onclick=closeTransaction;
document.querySelectorAll('input[name="type"]').forEach(el=>el.addEventListener("change",()=>updateCategoryOptions(el.value)));
$("transactionForm").addEventListener("submit",e=>{e.preventDefault();const amount=Number($("amount").value),title=$("title").value.trim(),date=$("date").value;if(!title||!date||!Number.isFinite(amount)||amount<=0){toast("Enter a title, date and amount above zero.");return}
 const id=$("editId").value?Number($("editId").value):Date.now();const item={id,title,amount,date,type:document.querySelector('input[name="type"]:checked').value,category:$("category").value,notes:$("notes").value.trim()};const index=transactions.findIndex(t=>t.id===id);if(index>=0)transactions[index]=item;else transactions.push(item);save();closeTransaction();render();toast(index>=0?"Transaction updated":"Transaction added")});
$("transactionRows").addEventListener("click",e=>{const edit=e.target.closest("[data-edit]"),del=e.target.closest("[data-delete]");if(edit){const t=transactions.find(x=>x.id===Number(edit.dataset.edit));if(t)openTransaction(t)}if(del){const id=Number(del.dataset.delete);if(confirm("Delete this transaction?")){transactions=transactions.filter(t=>t.id!==id);save();render();toast("Transaction deleted")}}});
$("monthPicker").addEventListener("change",e=>{selectedMonth=e.target.value||monthNow();render()});
["searchInput","typeFilter","categoryFilter"].forEach(id=>$(id).addEventListener(id==="searchInput"?"input":"change",render));
function openBudget(){$("budgetInput").value=budgets[selectedMonth]||"";$("budgetDialog").showModal()}
$("editBudget").onclick=openBudget;$("closeBudget").onclick=()=>$("budgetDialog").close();$("cancelBudget").onclick=()=>$("budgetDialog").close();
$("budgetForm").addEventListener("submit",e=>{e.preventDefault();const n=Number($("budgetInput").value);if(!Number.isFinite(n)||n<=0){toast("Enter a budget greater than zero.");return}budgets[selectedMonth]=n;save();$("budgetDialog").close();render();toast("Monthly budget saved")});
$("exportCsv").onclick=()=>{const rows=[["Title","Amount","Type","Category","Date","Notes"],...monthItems().map(t=>[t.title,t.amount,t.type,t.category,t.date,t.notes||""])];const csv=rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(",")).join("\r\n");download(csv,`pennywise-${selectedMonth}.csv`,"text/csv");toast("CSV exported")};
$("backupBtn").onclick=()=>{download(JSON.stringify({transactions,budgets,version:1},null,2),`pennywise-backup-${today()}.json`,"application/json");toast("Backup downloaded")};
function download(content,name,type){const blob=new Blob([content],{type}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;a.click();URL.revokeObjectURL(url)}
$("importFile").addEventListener("change",async e=>{const file=e.target.files[0];if(!file)return;try{const data=JSON.parse(await file.text());if(!Array.isArray(data.transactions)||!data.budgets||typeof data.budgets!=="object")throw Error();if(!confirm("Import this backup? It will replace the transactions and budgets currently saved in this browser."))return;transactions=data.transactions.filter(t=>t&&Number.isFinite(Number(t.amount))&&t.amount>0&&["income","expense"].includes(t.type));budgets=data.budgets;save();render();toast("Backup imported")}catch(err){toast("That backup file is not valid.")}e.target.value=""});
render();