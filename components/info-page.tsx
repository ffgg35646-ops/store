import Link from "next/link";
import { PageIntro } from "@/components/store-shell";
import { useLanguage } from "@/components/language-provider";
import { localizeCustomerCopy } from "@/components/customer-localization";
export function InfoPage({eyebrow,title,intro,sections}:{eyebrow:string;title:string;intro:string;sections:{heading:string;body:string}[]}){
 const {language}=useLanguage(); const copy=(v:string)=>localizeCustomerCopy(v,language);
 return <main className="main-content narrow-page info-page"><PageIntro eyebrow={copy(eyebrow)} title={copy(title)} description={copy(intro)}/><div className="data-card info-content">{sections.map((section,index)=><section key={index}><h2>{copy(section.heading)}</h2><p>{copy(section.body)}</p></section>)}<div className="info-contact"><p>{copy("Questions? Our support team can help.")}</p><Link className="button button-primary" href="/contact">{copy("Contact support")}</Link></div></div></main>;
}
