"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, CircleUserRound, LockKeyhole, Mail, Save, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { PageIntro } from "@/components/store-shell";
import { useLanguage } from "@/components/language-provider";

export function ProfileClient() {
  const { t, language } = useLanguage();
  const [user, setUser] = useState<any>(null);
  const [profileName, setProfileName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me", { cache: "no-store" })
      .then(response => response.json())
      .then(data => {
        if (!active) return;
        setUser(data.user || null);
        setProfileName(data.user?.name || "");
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: profileName, currentPassword, newPassword })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not update profile.");
      setUser((previous: any) => ({ ...previous, ...data.user }));
      setCurrentPassword("");
      setNewPassword("");
      setMessage(t("profileUpdated"));
    } catch (error: any) {
      setMessage(error.message || "Could not update profile.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <main className="main-content profile-page"><div className="loading-block" /></main>;
  if (!user) return (
    <main className="main-content profile-page">
      <div className="empty-state">
        <CircleUserRound />
        <b>{t("signInToView")}</b>
        <Link href="/login?next=%2Fprofile" className="button button-primary">{t("signIn")}</Link>
      </div>
    </main>
  );

  const firstName = user.name?.trim()?.split(/\s+/)[0] || (language === "ar" ? "عميل" : "Customer");

  return (
    <main className="main-content profile-page">
      <div className="profile-heading-row">
        <PageIntro eyebrow={t("profileEyebrow")} title={t("profileTitle")} description={t("profileDescription")} />
        <span className="profile-protection"><ShieldCheck size={17} />{t("profileSecure")}</span>
      </div>

      <section className="profile-hero-card">
        <div className="profile-hero-banner">
          <span className="profile-banner-orb profile-banner-orb-one" />
          <span className="profile-banner-orb profile-banner-orb-two" />
          <span className="profile-banner-label"><Sparkles size={14} /> NOVA DIGITAL MEMBER</span>
        </div>
        <div className="profile-hero-content">
          <div className="profile-avatar-large">{user.name?.charAt(0)?.toUpperCase() || "U"}</div>
          <div className="profile-hero-identity">
            <h2>{user.name}</h2>
            <p><Mail size={14} />{user.email}</p>
            <span className="profile-member-status"><CheckCircle2 size={13} />{t("activeMember")}</span>
          </div>
          <div className="profile-hero-stat">
            <span>{t("rewardPoints")}</span>
            <strong>{Number(user.points || 0).toLocaleString(language === "ar" ? "ar-EG" : "en-US")}</strong>
            <small>{t("pointsShort")}</small>
          </div>
        </div>
      </section>

      <form className="profile-content-grid" onSubmit={saveProfile}>
        <section className="profile-panel">
          <div className="profile-panel-heading">
            <span className="profile-panel-icon"><UserRound size={19} /></span>
            <div><h2>{t("profileInformation")}</h2><p>{t("profileInformationDescription")}</p></div>
          </div>
          <div className="profile-fields">
            <label className="field profile-field">
              <span>{t("fullName")}</span>
              <input required minLength={2} maxLength={80} value={profileName} onChange={event => setProfileName(event.target.value)} />
            </label>
            <label className="field profile-field">
              <span>{t("emailAddress")}</span>
              <input value={user.email || ""} disabled />
              <small>{t("emailReadOnly")}</small>
            </label>
          </div>
          <div className="profile-account-note"><ShieldCheck size={17} /><span>{t("profilePrivacyNote")}</span></div>
        </section>

        <section className="profile-panel profile-security-panel">
          <div className="profile-panel-heading">
            <span className="profile-panel-icon"><LockKeyhole size={19} /></span>
            <div><h2>{t("profileSecurityTitle")}</h2><p>{t("profileSecurityDescription")}</p></div>
          </div>
          <div className="profile-fields">
            <label className="field profile-field">
              <span>{t("currentPassword")}</span>
              <input type="password" autoComplete="current-password" value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} />
            </label>
            <label className="field profile-field">
              <span>{t("newPassword")}</span>
              <input type="password" autoComplete="new-password" minLength={8} value={newPassword} onChange={event => setNewPassword(event.target.value)} placeholder={t("leaveBlankPassword")} />
              <small>{t("passwordChangeHint")}</small>
            </label>
          </div>
        </section>

        <div className="profile-form-footer">
          <span className="profile-form-message">{message && <span className={message === t("profileUpdated") ? "success-message" : "error-message"}>{message}</span>}</span>
          <button className="button button-primary profile-save-button" disabled={saving}>
            <Save size={16} />{saving ? t("saving") : t("saveProfileChanges")}
          </button>
        </div>
      </form>
    </main>
  );
}
