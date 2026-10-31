import { InfoPage } from "@/components/info-page";
export default function TermsPage(){return <InfoPage eyebrow="PLEASE READ" title="Terms & conditions" intro="By using Nova Digital, you agree to these store terms. Review each product description before purchasing." sections={[
{heading:"Products and availability",body:"Digital products, subscription terms, supported regions, account type, duration and delivery method can differ by listing. Please read the product page and ask support if anything is unclear."},
{heading:"Orders and payment",body:"An order is not treated as paid until payment is confirmed by the applicable payment provider or an administrator reviewing a manual transfer. Prices and availability can change before an order is accepted."},
{heading:"Digital delivery",body:"Automatic products are delivered from available inventory after successful payment. Manual products are delivered by the store team. Keep delivered codes and account details private and use them only as allowed by the product provider."},
{heading:"Refunds and support",body:"Refund eligibility depends on the product, delivery state, applicable law and payment method. Contact support with your order number before requesting a refund. A manual bank transfer refund may need to be sent through the original transfer channel."},
{heading:"Acceptable use",body:"Do not attempt to access another customer’s account, interfere with the store, abuse promotions, or submit false payment references. Accounts may be suspended when needed to investigate misuse."},
{heading:"Changes",body:"These terms may be updated as the store and its payment or delivery options change. The latest version will be published on this page."}
]}/>}
