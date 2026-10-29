const SUPABASE_URL = 'https://xokmikmamamkurfyxunz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_j1N3Rq91kq2paXKR_hBU1w_OC0rRSRV';
const crmClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const $ = (id) => document.getElementById(id);
let companies = [], filter = 'today', selectedOutcome = 'no_answer';
const OUTCOMES = {no_answer:'Не ответили',not_interested:'Неинтересно',whatsapp_sent:'Отправил WhatsApp',callback:'Нужен перезвон',interested:'Есть интерес',custom:'Свой результат'};
const localDate = (date) => { const d = date ? new Date(date) : new Date(); d.setMinutes(d.getMinutes()-d.getTimezoneOffset()); return d.toISOString().slice(0,16); };
const today = () => new Date().toISOString().slice(0,10);
function formatDate(v){if(!v)return 'без даты';return new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(v));}
function whatsappUrl(phone){return `https://wa.me/${(phone||'').replace(/\D/g,'')}`;}function setAuthMessage(msg=''){ $('auth-message').textContent=msg; }
const noteStamp=()=>{const d=new Date(),p=n=>String(n).padStart(2,'0');return `${p(d.getDate())}.${p(d.getMonth()+1)}.${String(d.getFullYear()).slice(-2)} ${p(d.getHours())}:${p(d.getMinutes())}`;};
function showNotes(notes){const box=$('notes-history'),text=(notes||'').trim();box.hidden=!text;box.textContent=text;}async function showApp(){const auth=$('auth-view'),app=$('app-view');auth.hidden=true;auth.style.display='none';app.hidden=false;app.style.removeProperty('display');$('today-label').textContent=new Intl.DateTimeFormat('ru-RU',{weekday:'long',day:'numeric',month:'long'}).format(new Date());await loadCompanies();}
async function loadCompanies(){ const {data,error}=await crmClient.from('companies').select('*').order('next_action_at',{ascending:true,nullsFirst:false});if(error){alert(error.message);return;}companies=data||[];render(); }
function filtered(){ const start=today();if(filter==='all')return companies;if(filter==='overdue')return companies.filter(c=>c.next_action_at&&c.next_action_at.slice(0,10)<start);return companies.filter(c=>c.next_action_at&&c.next_action_at.slice(0,10)===start); }function render(){ const items=filtered();$('today-count').textContent=items.length;$('task-list').innerHTML=items.map(c=>{const overdue=c.next_action_at&&c.next_action_at.slice(0,10)<today();const callPhone=c.contact_phone||c.phone||'';return `<article class="task-card ${overdue?'overdue':''}"><div><h2>${escapeHtml(c.company_name)}</h2><div class="meta"><span class="badge">${c.language}</span>${c.contact_name?`<span>${escapeHtml(c.contact_name)}</span>`:''}${c.contact_phone?`<span>${escapeHtml(c.contact_phone)}</span>`:''}<span>${overdue?'Просрочено: ':''}${formatDate(c.next_action_at)}</span></div></div><div class="card-actions"><a class="call" href="tel:${encodeURIComponent(callPhone)}"><button class="call">Позвонить</button></a><a target="_blank" rel="noopener" href="${whatsappUrl(c.contact_phone||c.whatsapp||c.phone)}"><button class="wa">WhatsApp</button></a><button class="more" data-edit="${c.id}">⋯</button></div></article>`;}).join('');$('empty-state').hidden=items.length!==0;document.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>openCompany(companies.find(c=>c.id===b.dataset.edit))); }
function escapeHtml(text=''){return text.replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]));}
function openCompany(c=null){$('company-form').reset();$('company-id').value=c?.id||'';$('dialog-title').textContent=c?'Компания':'Новая компания';$('company-name').value=c?.company_name||'';$('contact-name').value=c?.contact_name||'';$('contact-phone').value=c?.contact_phone||'';$('phone').value=c?.phone||'';$('language').value=c?.language||'EN';$('next-action').value=c?.next_action_at?localDate(c.next_action_at):localDate();$('notes').value='';showNotes(c?.notes);$('delete-company').hidden=!c;$('company-dialog').showModal();}
function openOutcome(c){ $('outcome-company').textContent=c.company_name;selectedOutcome='no_answer';$('outcome-note').value='';$('outcome-next').value=localDate();$('outcome-options').innerHTML=Object.entries(OUTCOMES).map(([k,v])=>`<button type="button" class="outcome ${k===selectedOutcome?'selected':''}" data-outcome="${k}">${v}</button>`).join('');document.querySelectorAll('[data-outcome]').forEach(b=>b.onclick=()=>{selectedOutcome=b.dataset.outcome;document.querySelectorAll('[data-outcome]').forEach(x=>x.classList.toggle('selected',x===b));});$('outcome-dialog').dataset.companyId=c.id;$('outcome-dialog').showModal(); }
$('auth-form').onsubmit=async(e)=>{e.preventDefault();setAuthMessage();$('auth-submit').disabled=true;const {error}=await crmClient.auth.signInWithPassword({email:$('email').value,password:$('password').value});$('auth-submit').disabled=false;if(error)setAuthMessage(error.message);else showApp();};
$('signup-button').onclick=async()=>{setAuthMessage();const {error}=await crmClient.auth.signUp({email:$('email').value,password:$('password').value});setAuthMessage(error?'Ошибка: '+error.message:'Проверь почту и подтверди аккаунт. Затем войди.');};
$('signout').onclick=async()=>{await crmClient.auth.signOut();location.reload();};
$('new-company').onclick=() => openCompany();$('empty-add').onclick=()=>openCompany();$('cancel-dialog').onclick=()=>$('company-dialog').close();$('cancel-outcome').onclick=()=>$('outcome-dialog').close();$('company-form').onsubmit=async(e)=>{e.preventDefault();const id=$('company-id').value;const previous=companies.find(c=>c.id===id)?.notes?.trim()||'';const added=$('notes').value.trim();const notes=added?`${noteStamp()}
${added}${previous?`

${previous}`:''}`:(previous||null);const row={company_name:$('company-name').value.trim(),contact_name:$('contact-name').value.trim()||null,contact_phone:$('contact-phone').value.trim()||null,phone:$('phone').value.trim()||null,whatsapp:$('phone').value.trim()||null,language:$('language').value,next_action_at:$('next-action').value?new Date($('next-action').value).toISOString():null,notes,updated_at:new Date().toISOString()};const q=id?crmClient.from('companies').update(row).eq('id',id):crmClient.from('companies').insert(row);const {error}=await q;if(error)alert(error.message);else{$('company-dialog').close();await loadCompanies();}};
$('delete-company').onclick=async()=>{if(!confirm('Удалить компанию и её историю звонков?'))return;const {error}=await crmClient.from('companies').delete().eq('id',$('company-id').value);if(error)alert(error.message);else{$('company-dialog').close();loadCompanies();}};
$('outcome-form').onsubmit=async(e)=>{e.preventDefault();const id=$('outcome-dialog').dataset.companyId;const next=$('outcome-next').value?new Date($('outcome-next').value).toISOString():null;const note=$('outcome-note').value.trim()||null;const {error}=await crmClient.from('call_logs').insert({company_id:id,outcome:selectedOutcome,note,next_action_at:next});if(error){alert(error.message);return;}const upd=await crmClient.from('companies').update({status:selectedOutcome,custom_status:selectedOutcome==='custom'?note:null,last_contacted_at:new Date().toISOString(),next_action_at:next,updated_at:new Date().toISOString()}).eq('id',id);if(upd.error){alert(upd.error.message);return;}$('outcome-dialog').close();await loadCompanies();};
document.querySelectorAll('.filter').forEach(b=>b.onclick=()=>{filter=b.dataset.filter;document.querySelectorAll('.filter').forEach(x=>x.classList.toggle('active',x===b));render();});
document.addEventListener('click',e=>{const c=e.target.closest('.call');if(c?.tagName==='BUTTON'){const card=e.target.closest('.task-card');const company=companies.find(x=>x.id===card.querySelector('[data-edit]')?.dataset.edit);if(company)setTimeout(()=>openOutcome(company),250);}});function showAuth(){const auth=$('auth-view'),app=$('app-view');app.hidden=true;app.style.display='none';auth.hidden=false;auth.style.removeProperty('display');}
crmClient.auth.onAuthStateChange((_event,session)=>{if(session)showApp();else showAuth();});
crmClient.auth.getSession().then(({data:{session}})=>{if(session)showApp();else showAuth();});

const STATUS={new:'Не связывался',not_relevant:'Не актуально',warming:'Прогрев',working:'В работе'};let statusFilter='all';function whatsappUrl(phone){let n=(phone||'').replace(/\D/g,'');if(/^0\d{8,9}$/.test(n))n='972'+n.slice(1);return 'https://wa.me/'+n;}function lastNote(n=''){return n.replace(/^\*экспорт\*\s*/,'').trim().split(/\n\s*\n/)[0].replace(/^\d{2}\.\d{2}\.\d{2} \d{2}:\d{2}\s*/,'').trim();}const oldFiltered=filtered;filtered=()=>oldFiltered().filter(c=>statusFilter==='all'||(c.status||'new')===statusFilter);const oldRender=render;render=()=>{oldRender();document.querySelectorAll('.task-card').forEach((el,i)=>{const c=filtered()[i];if(!c)return;el.classList.add('status-'+(c.status||'new'));const meta=el.querySelector('.meta');meta.insertAdjacentHTML('beforeend','<span class="status-label">'+STATUS[c.status||'new']+'</span>');if(c.contact_name&&lastNote(c.notes))meta.insertAdjacentHTML('beforeend','<span class="last-note">'+escapeHtml(lastNote(c.notes))+'</span>');});};const oldOpen=openCompany;openCompany=c=>{oldOpen(c);$('company-status').value=c?.status||'new';};const sf=document.createElement('select');sf.id='status-filter';sf.innerHTML='<option value="all">Все статусы</option><option value="new">Не связывался</option><option value="not_relevant">Не актуально</option><option value="warming">Прогрев</option><option value="working">В работе</option>';document.querySelector('.filters').after(sf);const cs=document.createElement('label');cs.className='full';cs.innerHTML='Статус<select id="company-status"><option value="new">Не связывался</option><option value="not_relevant">Не актуально</option><option value="warming">Прогрев</option><option value="working">В работе</option></select>';document.querySelector('.form-grid').append(cs);document.head.insertAdjacentHTML('beforeend','<style>.task-card.status-not_relevant{background:#f8e6e5}.task-card.status-warming{background:#faf5dc}.task-card.status-working{background:#e6f3e8}.status-label{font-weight:700}.last-note{width:100%;font-size:.84rem;color:#42514d}</style>');$('company-form').addEventListener('submit',async()=>{const id=$('company-id').value;if(id)await crmClient.from('companies').update({status:$('company-status').value,updated_at:new Date().toISOString()}).eq('id',id);});sf.onchange=e=>{statusFilter=e.target.value;render();};
const baseLoad=loadCompanies;loadCompanies=async()=>{const prior=new Map(companies.map((c,i)=>[c.id,i]));const {data,error}=await crmClient.from('companies').select('*');if(error){alert(error.message);return;}companies=(data||[]).sort((a,b)=>(prior.get(a.id)??1e9)-(prior.get(b.id)??1e9));render();};const statusRender=render;render=()=>{statusRender();document.querySelectorAll('.status-label').forEach(x=>x.remove());document.querySelectorAll('.task-card').forEach((el,i)=>{const c=filtered()[i];if(c&&lastNote(c.notes)&&!el.querySelector('.last-note'))el.querySelector('.meta').insertAdjacentHTML('beforeend','<span class="last-note">'+escapeHtml(lastNote(c.notes))+'</span>');});};

/* Pre-filled WhatsApp advertising message (user sends manually). */
const ADV_WHATSAPP_TEXT = 'היי. דיברנו עכשיו. הנה האתר שלי עם דירות. כשיהיו לך פרויקטים, בהחלט נוכל לעזור אחד לשני. בהצלחה! https://tinyurl.com/BLAGO-HOME';
function advertisingWhatsappUrl(company) {
  const raw = company.contact_phone || company.whatsapp || company.phone || '';
  let number = raw.replace(/\D/g, '');
  if (/^0\d{9}$/.test(number)) number = '972' + number.slice(1);
  if (!/^\d{8,15}$/.test(number)) return null;
  return 'https://wa.me/' + number + '?text=' + encodeURIComponent(ADV_WHATSAPP_TEXT);
}
OUTCOMES.adv_whatsapp = 'Send adv WhatsApp';
const renderBeforeAdvertising = render;
render = () => {
  renderBeforeAdvertising();
  document.querySelectorAll('.task-card').forEach((card, index) => {
    const company = filtered()[index];
    if (!company) return;
    const actions = card.querySelector('.card-actions');
    const url = advertisingWhatsappUrl(company);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'wa';
    button.textContent = 'Send adv WhatsApp';
    button.disabled = !url;
    if (!url) button.title = 'Укажите телефон компании';
    button.addEventListener('click', () => {
      if (url) window.open(url, '_blank', 'noopener,noreferrer');
    });
    actions.insertBefore(button, actions.querySelector('[data-edit]'));
  });
};
