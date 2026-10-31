import { InfoPage } from "@/components/info-page";
export default function PrivacyPage(){return <InfoPage eyebrow="YOUR DATA" title="Privacy policy" intro="This policy explains the information used to operate your Nova Digital account and purchases." sections={[
{heading:"Information we collect",body:"When you create an account or place an order, we process details such as your name, email address, account status, order history, payment status, wallet transactions and messages sent to support."},
{heading:"How information is used",body:"We use this information to provide account access, process orders, deliver digital items, prevent misuse, maintain transaction records, respond to support requests and send account-related notifications."},
{heading:"Payments",body:"Card payments, when enabled, are handled by the configured payment provider. Do not send card security codes or passwords through support chat. Manual transfer references may be stored with the related order."},
{heading:"Retention and security",body:"Passwords are stored as salted password hashes. Session cookies are HTTP-only. Order and financial records may be retained when needed for accounting, dispute handling or fraud prevention. No online service can guarantee absolute security."},
{heading:"Your choices",body:"You may update your profile details, contact support about your account, or request account deactivation where permitted. Deactivation may not remove historical transaction records that must be retained."},
{heading:"Contact",body:"For privacy questions, use the contact page or the support chat available on this site."}
]}/>}
