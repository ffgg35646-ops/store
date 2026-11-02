"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Headphones, MessageCircle, Send, UserRound } from "lucide-react";
import { PageIntro } from "@/components/store-shell";
import { useLanguage } from "@/components/language-provider";
import { localizeCustomerCopy, localizeCustomerError } from "@/components/customer-localization";

export function ChatClient({ adminMode=false }: {adminMode?:boolean}) {
  const { t, language } = useLanguage();
  const [conversations,setConversations]=useState<any[]>([]);
  const [selected,setSelected]=useState<any>(null);
  const [messages,setMessages]=useState<any[]>([]);
  const [text,setText]=useState("");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [user,setUser]=useState<any>(null);
  const [initialConversationLoaded,setInitialConversationLoaded]=useState(false);\n  const copy=(english:string,arabic:string)=>adminMode?arabic:localizeCustomerCopy(english,language);
  async function loadConversations() {
    const [c,u]=await Promise.all([fetch("/api/chat").then(r=>r.json()),fetch("/api/auth/me").then(r=>r.json())]);
    setConversations(c.conversations||[]);setUser(u.user);
    if(adminMode&&!initialConversationLoaded){const requestedId=new URLSearchParams(window.location.search).get("conversation");const requested=(c.conversations||[]).find((item:any)=>String(item._id)===requestedId);if(requested){setInitialConversationLoaded(true);await openConversation(requested);}else if(requestedId)setInitialConversationLoaded(true);}
  }
  async function openConversation(conversation:any) {
    setSelected(conversation);
    const data=await fetch(`/api/chat/${conversation._id}`).then(r=>r.json());
    if(data.messages)setMessages(data.messages);
  }
  useEffect(()=>{loadConversations().catch(()=>setError(copy("Please sign in to use support chat.","تعذر تحميل صندوق رسائل الدعم. حدّث الصفحة وحاول مرة أخرى.")));},[]);
  useEffect(()=>{
    if(!selected)return;
    const timer=setInterval(async()=>{
      const data=await fetch(`/api/chat/${selected._id}`).then(r=>r.json());
      if(data.messages)setMessages(data.messages);
      loadConversations();
    },7000);
    return()=>clearInterval(timer);
  },[selected?._id]);
  async function createConversation(e:React.FormEvent) {
    e.preventDefault();setBusy(true);setError("");
    try{
      const response=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({subject:t("supportChat")})});
      const data=await response.json();if(!response.ok)throw new Error(adminMode?(data.error||"تعذر بدء المحادثة."):localizeCustomerError(data.error||"Unable to start chat.",language,t));
      await loadConversations();await openConversation(data.conversation);
    }catch(err:any){setError(localizeCustomerError(err.message,language,t));}finally{setBusy(false);}
  }
  async function sendMessage(e:React.FormEvent) {
    e.preventDefault();if(!text.trim()||!selected)return;
    const content=text.trim();setText("");setBusy(true);setError("");
    try{
      const response=await fetch(`/api/chat/${selected._id}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({content})});
      const data=await response.json();if(!response.ok)throw new Error(adminMode?(data.error||"تعذر إرسال الرسالة."):localizeCustomerError(data.error||"Message could not be sent.",language,t));
      setMessages(current=>[...current,data.message]);loadConversations();
    }catch(err:any){setError(localizeCustomerError(err.message,language,t));setText(content);}finally{setBusy(false);}
  }
  return <div className={adminMode?"admin-chat-wrap":"main-content narrow-page chat-page"}>
    {!adminMode&&<PageIntro eyebrow={localizeCustomerCopy("WE'RE HERE FOR YOU",language)} title={localizeCustomerCopy("Support chat",language)} description={localizeCustomerCopy("Chat directly with our team about products, payments or an order.",language)}/>}
    <div className="chat-layout">
      <aside className={selected?"chat-sidebar mobile-hidden":"chat-sidebar"}>
        <div className="chat-side-heading"><div><Headphones/><b>{adminMode?"صندوق رسائل العملاء":localizeCustomerCopy("Your conversations",language)}</b></div><span>{conversations.length}</span></div>
        {!adminMode&&<form onSubmit={createConversation} className="new-chat-form"><button disabled={busy}>{t("startChatWithSupport")}</button></form>}
        <div className="conversation-list">{conversations.map(c=><button key={c._id} onClick={()=>openConversation(c)} className={selected?._id===c._id?"conversation-item active":"conversation-item"}><span className="conversation-avatar"><UserRound size={17}/></span><span className="conversation-meta"><b>{adminMode?(c.userId?.name||copy("Customer","العميل")):localizeCustomerCopy(c.subject,language)}</b><small>{localizeCustomerCopy(c.lastMessage||c.subject,language)}</small><small>{new Date(c.lastMessageAt||c.createdAt).toLocaleString()}</small></span><i className="unread-count">{adminMode?c.adminUnread:c.customerUnread}</i></button>)}
          {!conversations.length&&<div className="empty-state compact"><MessageCircle/><b>{copy("No conversations yet","لا توجد محادثات حتى الآن")}</b><span>{adminMode?"ستظهر رسائل العملاء الجديدة هنا.":localizeCustomerCopy("Start a conversation with our team.",language)}</span></div>}
        </div>
      </aside>
      <section className={selected?"chat-window":"chat-window chat-window-empty"}>
        {selected?<><div className="chat-window-head"><button className="chat-back mobile-only" onClick={()=>setSelected(null)}><ArrowLeft size={17}/></button><div className="conversation-avatar"><UserRound size={18}/></div><div><b>{adminMode?(selected.userId?.name||copy("Customer","العميل")):localizeCustomerCopy(selected.subject,language)}</b><small>{selected.status==="open"?copy("Support team is available","فريق الدعم متاح"):copy("Conversation closed","المحادثة مغلقة")}</small></div><span className="online-indicator">● {copy("Online","متصل")}</span></div>
          <div className="message-list"><div className="chat-start-note"><span>✦</span><b>{copy("Start of conversation","بداية المحادثة")}</b><small>{copy("Share your question and our team will reply here.","اكتب استفسارك وسيرد عليك فريق الدعم هنا.")}</small></div>{messages.map((m:any)=><div key={m._id} className={String(m.senderId?._id||m.senderId)===String(user?._id)?"message-row mine":"message-row"}><div className="message-bubble"><p>{m.content}</p><small>{m.senderRole==="admin"?copy("Support team","فريق الدعم"):m.senderId?.name||copy("You","أنت")} · {new Date(m.createdAt).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}</small></div></div>)}</div>
          <form className="chat-compose" onSubmit={sendMessage}><input value={text} onChange={e=>setText(e.target.value)} placeholder={copy("Write your message...","اكتب رسالتك...")} disabled={selected.status==="closed"||busy}/><button disabled={!text.trim()||busy||selected.status==="closed"} aria-label={language==="ar"?"إرسال الرسالة":"Send message"}><Send size={18}/></button></form>
        </>:<div className="chat-placeholder"><div className="chat-placeholder-icon"><MessageCircle size={28}/></div><h3>{copy("Select a conversation","اختر محادثة")}</h3><p>{copy("Choose a chat from the list to read messages and reply.","اختر محادثة من القائمة لقراءة الرسائل والرد عليها.")}</p></div>}
        {error&&<div className="chat-error">{error}</div>}
      </section>
    </div>
  </div>;
}
