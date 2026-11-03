/* Every page opening starts with an explicit account/guest choice. */
window.ArenaEntry=(()=>{
 const A=ArenaAccount;
 let dialog=null,screen='choice',working=false,signature='';
 const action=(label,value,primary=false)=>`<button type="button" class="b${primary?' entry-primary':''}" data-entry="${value}">${label}</button>`;
 const head=(title,copy)=>`<img class="entry-mark" src="arena-logo.svg" alt="" width="58" height="58"><p class="entry-eyebrow">ARENASTRIKE</p><h2 id="entry-title" tabindex="-1">${title}</h2><p id="entry-description">${copy}</p>`;
 const guest=()=>`${action('Continue as guest','guest')}<p class="entry-fine">Guest progress stays on this browser. You can make an account later.</p>`;
 function choices(){
  const signedIn=!!(A.user&&A.ready),name=esc(A.profile?.name||'Player');
  const primary=signedIn?`${action('Continue as '+name,'continue',true)}${action('Use a different account','signin')}`:`${action('Create an account','signup',true)}${action('Sign in','signin')}`;
  return `${head(signedIn?'Welcome back, '+name:'How do you want to play?',signedIn?'Continue your saved progress, or play as a guest.':'Make an account to save your collection and pick up on another device.')}<div class="entry-actions">${primary}${guest()}</div><p class="entry-status" role="status" aria-live="polite">${!A.configured?'Accounts are unavailable right now. You can still play as a guest.':A.user&&!A.ready?'Loading your saved account…':''}</p>`;
 }
 function form(){
  const signup=screen==='signup',reset=screen==='reset';
  return `${head(reset?'Reset your password':signup?'Make it your game':'Welcome back',reset?'We’ll email you a link to choose a new password.':signup?'Save your skins, outfits and progress to your account.':'Sign in to load your saved progress.')}<form id="entry-form"><label>Email<input name="email" type="email" autocomplete="email" required></label>${reset?'':`<label>Password<input name="password" type="password" autocomplete="${signup?'new-password':'current-password'}" minlength="8" required></label>`}<button type="submit" class="b entry-primary">${reset?'Send reset link':signup?'Create account':'Sign in'}</button><p class="entry-status" role="status" aria-live="polite"></p></form><div class="entry-actions">${screen==='signin'?action('Forgot password?','reset'):''}${action('Back','back')}${guest()}</div>`;
 }
 function render(next=screen){
  screen=next;signature=[A.user?.id,A.ready,A.profile?.name,A.configured].join('|');
  dialog.innerHTML=`<section class="entry-screen">${screen==='choice'?choices():form()}</section>`;
  if(!A.configured)dialog.querySelectorAll('[data-entry=signup],[data-entry=signin]').forEach(b=>b.disabled=true);
  dialog.querySelector('#entry-title').focus({preventScroll:true});
 }
 function close(){if(!dialog)return;dialog.close();dialog.remove();dialog=null;working=false;document.body.classList.remove('entry-open');goLobby();document.getElementById('go')?.focus({preventScroll:true})}
 function status(message){const out=dialog?.querySelector('.entry-status');if(out)out.textContent=message}
 function busy(value){working=value;dialog?.querySelectorAll('button').forEach(b=>b.disabled=value)}
 async function click(event){
  const button=event.target.closest('[data-entry]');if(!button||working)return;
  const value=button.dataset.entry;
  if(['signup','signin','reset','back'].includes(value)){render(value==='back'?'choice':value);return}
  busy(true);
  try{if(value==='guest'){await A.enterGuest();close()}else if(value==='continue'){if(!A.user||!A.ready)throw Error('Your account is still loading. Please try again.');close()}}
  catch(error){status(error.message||'Please try again.')}finally{busy(false)}
 }
 async function submit(event){
  if(event.target.id!=='entry-form')return;event.preventDefault();if(working)return;
  const data=new FormData(event.target),email=String(data.get('email')).trim(),password=String(data.get('password')||'');
  busy(true);status(screen==='reset'?'Sending reset link…':'Connecting…');
  try{
   if(!A.client)throw Error('Accounts are unavailable right now. Continue as a guest to play.');
   if(screen==='reset'){const r=await A.client.auth.resetPasswordForEmail(email,{redirectTo:A.siteUrl});if(r.error)throw r.error;status('If this account exists, a reset link is on its way.');return}
   const r=screen==='signup'?await A.client.auth.signUp({email,password,options:{emailRedirectTo:A.siteUrl}}):await A.client.auth.signInWithPassword({email,password});
   if(r.error)throw r.error;
   if(r.data.session){status('Loading your progress…');await A.useSession(r.data.session);close()}
   else{event.target.querySelector('[name=password]').value='';status('Check your email to confirm your account. You can play as a guest while you wait.')}
  }catch(error){status(error.message||'Could not sign in. Try again, or continue as a guest.')}finally{busy(false)}
 }
 function open(){
  if(dialog?.open)return;
  // Verification/reset links keep their intended destination.
  if(A.recovery){openPage('account');return}
  dialog=document.createElement('dialog');dialog.id='arena-entry';dialog.setAttribute('aria-labelledby','entry-title');dialog.setAttribute('aria-describedby','entry-description');
  dialog.addEventListener('cancel',event=>event.preventDefault());dialog.addEventListener('click',click);dialog.addEventListener('submit',submit);
  document.body.appendChild(dialog);document.body.classList.add('entry-open');render('choice');dialog.showModal();dialog.querySelector('#entry-title').focus({preventScroll:true});
 }
 document.addEventListener('arena-account',()=>{
  if(!dialog||working)return;
  if(A.recovery){dialog.close();dialog.remove();dialog=null;document.body.classList.remove('entry-open');openPage('account');return}
  if(screen==='choice'&&signature!==[A.user?.id,A.ready,A.profile?.name,A.configured].join('|'))render();
 });
 return{open};
})();
