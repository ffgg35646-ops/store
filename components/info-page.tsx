import Link from "next/link";
import { PageIntro } from "@/components/store-shell";
export function InfoPage({eyebrow,title,intro,sections}:{eyebrow:string;title:string;intro:string;sections:{heading:string;body:string}[]}){
 return <main className="main-content narrow-page info-page"><PageIntro eyebrow={eyebrow} title={title} description={intro}/><div className="data-card info-content">{sections.map((section,index)=><section key={index}><h2>{section.heading}</h2><p>{section.body}</p></section>)}<div className="info-contact"><p>Questions? Our support team can help.</p><Link className="button button-primary" href="/contact">Contact support</Link></div></div></main>;
}
