"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Headphones, MessageCircle, Send, UserRound } from "lucide-react";
import { PageIntro } from "@/components/store-shell";

export function ChatClient({ adminMode=false }: {adminMode?:boolean}) {
  const [conversations,setConversations]=useState<any[]>([]);
  const [selected,setSelected]=useState<any>(null);
  const [messages,setMessages]=useState<any[]>([]);
  const [text,setText]=useState("");
  const [subject,setSubject]=useState("");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [user,setUser]=useState<any>(null);
  async function loadConversations() {
    const [c,u]=await Promise.all([fetch("/api/chat").then(r=>r.json()),fetch("/api/auth/me").then(r=>r.json())]);
    setConversations(c.conversations||[]);setUser(u.user);
  }
  async function openConversation(conversation:any) {
    setSelected(conversation);
    const data=await fetch(`/api/chat/${conversation._id}`).then(r=>r.json());
    if(data.messages)setMessages(data.messages);
  }
  useEffect(()=>{loadConversations().catch(()=>setError("Please sign in to use support chat."));},[]);
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
      const response=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({subject:subject||"Customer support"})});
      const data=await response.json();if(!response.ok)throw new Error(data.error||"Unable to start chat.");
      setSubject("");await loadConversations();await openConversation(data.conversation);
    }catch(err:any){setError(err.message);}finally{setBusy(false);}
  }
  async function sendMessage(e:React.FormEvent) {
    e.preventDefault();if(!text.trim()||!selected)return;
    const content=text.trim();setText("");setBusy(true);setError("");
    try{
      const response=await fetch(`/api/chat/${selected._id}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({content})});
      const data=await response.json();if(!response.ok)throw new Error(data.error||"Message could not be sent.");
      setMessages(current=>[...current,data.message]);loadConversations();
    }catch(err:any){setError(err.message);setText(content);}finally{setBusy(false);}
  }
  return <div className={adminMode?"admin-chat-wrap":"main-content narrow-page chat-page"}>
    {!adminMode&&<PageIntro eyebrow="WE'RE HERE FOR YOU" title="Support chat" description="Chat directly with our team about products, payments or an order."/>}
    <div className="chat-layout">
      <aside className={selected?"chat-sidebar mobile-hidden":"chat-sidebar"}>
        <div className="chat-side-heading"><div><Headphones/><b>{adminMode?"Customer inbox":"Your conversations"}</b></div><span>{conversations.length}</span></div>
        {!adminMode&&<form onSubmit={createConversation} className="new-chat-form"><input value={subject} onChange={e=>setSubject(e.target.value)} placeholder="What can we help with?"/><button disabled={busy}>Start a chat</button></form>}
        <div className="conversation-list">{conversations.map(c=><button key={c._id} onClick={()=>openConversation(c)} className={selected?._id===c._id?"conversation-item active":"conversation-item"}><span className="conversation-avatar"><UserRound size={17}/></span><span className="conversation-meta"><b>{adminMode?(c.userId?.name||"Customer"):c.subject}</b><small>{c.lastMessage||c.subject}</small><small>{new Date(c.lastMessageAt||c.createdAt).toLocaleString()}</small></span><i className="unread-count">{adminMode?c.adminUnread:c.customerUnread}</i></button>)}
          {!conversations.length&&<div className="empty-state compact"><MessageCircle/><b>No conversations yet</b><span>{adminMode?"New customer chats will appear here.":"Start a conversation with our team."}</span></div>}
        </div>
      </aside>
      <section className={selected?"chat-window":"chat-window chat-window-empty"}>
        {selected?<><div className="chat-window-head"><button className="chat-back mobile-only" onClick={()=>setSelected(null)}><ArrowLeft size={17}/></button><div className="conversation-avatar"><UserRound size={18}/></div><div><b>{adminMode?(selected.userId?.name||"Customer"):selected.subject}</b><small>{selected.status==="open"?"Support team is available":"Conversation closed"}</small></div><span className="online-indicator">● Online</span></div>
          <div className="message-list"><div className="chat-start-note"><span>✦</span><b>Start of conversation</b><small>Share your question and our team will reply here.</small></div>{messages.map((m:any)=><div key={m._id} className={String(m.senderId?._id||m.senderId)===String(user?._id)?"message-row mine":"message-row"}><div className="message-bubble"><p>{m.content}</p><small>{m.senderRole==="admin"?"Support team":m.senderId?.name||"You"} · {new Date(m.createdAt).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}</small></div></div>)}</div>
          <form className="chat-compose" onSubmit={sendMessage}><input value={text} onChange={e=>setText(e.target.value)} placeholder="Write your message..." disabled={selected.status==="closed"||busy}/><button disabled={!text.trim()||busy||selected.status==="closed"} aria-label="Send message"><Send size={18}/></button></form>
        </>:<div className="chat-placeholder"><div className="chat-placeholder-icon"><MessageCircle size={28}/></div><h3>Select a conversation</h3><p>Choose a chat from the list to read messages and reply.</p></div>}
        {error&&<div className="chat-error">{error}</div>}
      </section>
    </div>
  </div>;
}
