"use client";

import { useEffect, useState } from "react";
import { BellRing, CheckCircle2, ShieldCheck } from "lucide-react";

function decodeKey(value: string) {
  const padding = "=".repeat((4 - value.length % 4) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
}

export function NotificationSetup() {
  const [supported,setSupported]=useState(false);
  const [enabled,setEnabled]=useState(false);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  useEffect(()=>{
    const ok = typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    setSupported(ok);
    if(ok && Notification.permission==="granted") {
      navigator.serviceWorker.ready.then(reg=>reg.pushManager.getSubscription()).then(sub=>setEnabled(Boolean(sub))).catch(()=>{});
    }
  },[]);
  async function enable() {
    setBusy(true);setMessage("");
    try {
      if(!supported)throw new Error("This browser does not support push notifications.");
      const keyData=await fetch("/api/push/key").then(r=>r.json());
      if(!keyData.publicKey)throw new Error("Browser push is not configured by the store administrator yet.");
      const permission=await Notification.requestPermission();
      if(permission!=="granted")throw new Error("Please allow notifications in your browser settings.");
      const registration=await navigator.serviceWorker.register("/sw.js");
      const subscription=await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:decodeKey(keyData.publicKey) as BufferSource});
      const response=await fetch("/api/push/subscribe",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(subscription)});
      const data=await response.json();
      if(!response.ok)throw new Error(data.error||"Could not enable notifications.");
      setEnabled(true);setMessage("Browser notifications are enabled on this device.");
    }catch(error:any){setMessage(error.message||"Could not enable notifications.");}
    finally{setBusy(false);}
  }
  async function disable() {
    setBusy(true);setMessage("");
    try {
      const registration=await navigator.serviceWorker.ready;
      const subscription=await registration.pushManager.getSubscription();
      if(subscription) {
        await fetch("/api/push/subscribe",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({endpoint:subscription.endpoint})});
        await subscription.unsubscribe();
      }
      setEnabled(false);setMessage("Browser notifications are disabled on this device.");
    }catch(error:any){setMessage(error.message||"Could not disable notifications.");}
    finally{setBusy(false);}
  }
  return <div className="push-setup"><div className="push-setup-icon"><BellRing size={18}/></div><div className="push-setup-copy"><b>Browser notifications</b><small>{enabled?"This device can receive order and account alerts.":"Get order, delivery, chat and reward alerts even when this page is closed."}</small>{message&&<small className="push-message">{message}</small>}</div>{supported&&<button disabled={busy} onClick={enabled?disable:enable} className={enabled?"button button-outline":"button button-primary"}>{busy?"Please wait...":enabled?<><CheckCircle2 size={14}/> Enabled</>:"Enable"}</button>}</div>;
}
