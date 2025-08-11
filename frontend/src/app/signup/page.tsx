"use client";
import { useEffect, useState } from "react";
import { API_BASE, setToken } from "@/lib/api";
import { useRouter } from "next/navigation";
import AuthCard from "@/components/AuthCard";

export default function SignupPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [usernameStatus, setUsernameStatus] = useState<"idle"|"checking"|"available"|"taken">("idle");
  const [usernameMsg, setUsernameMsg] = useState<string>("");
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const form = new FormData();
      form.append("username", username);
      form.append("email", email);
      form.append("password", password);
      form.append("display_name", `${firstName} ${lastName}`.trim());
      form.append("avatar_url", avatarUrl);
      if (avatarFile) form.append("avatar_file", avatarFile);
      form.append("phone_number", phone);
      form.append("city", city);
      form.append("country", country);
      form.append("bio", bio);
      const res = await fetch(`${API_BASE}/accounts/signup`, { method: "POST", body: form });
      if (!res.ok) throw new Error(await res.text());
      // auto-login after signup
      const res2 = await fetch(`${API_BASE}/accounts/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res2.ok) throw new Error(await res2.text());
      const data = (await res2.json()) as { access: string };
      setToken(data.access);
      router.push("/trips");
    } catch (err: any) {
      setError(err.message || "Signup failed");
    }
  }

  return (
    <AuthCard title="Sign up" subtitle="Join GlobalTrotters and start planning.">
      <form onSubmit={onSubmit} className="grid gap-4">
          <label className="grid gap-1">
            <span className="label">Username</span>
            <input
              className="input"
              placeholder="yourname"
              value={username}
              onChange={async (e) => {
                const v = e.target.value;
                setUsername(v);
                if (!v || v.length < 3) { setUsernameStatus("idle"); setUsernameMsg(""); return; }
                setUsernameStatus("checking");
                try {
                  const res = await fetch(`${API_BASE}/accounts/check-username?username=${encodeURIComponent(v)}`);
                  const data = await res.json();
                  if (data && typeof data.available === "boolean") {
                    setUsernameStatus(data.available ? "available" : "taken");
                    setUsernameMsg(data.available ? "Username available" : "Username taken");
                  } else {
                    setUsernameStatus("idle"); setUsernameMsg("");
                  }
                } catch {
                  setUsernameStatus("idle"); setUsernameMsg("");
                }
              }}
              required
            />
            {usernameStatus !== "idle" && (
              <div className={`text-sm ${usernameStatus === "available" ? "text-green-500" : usernameStatus === "taken" ? "text-red-500" : "opacity-70"}`}>
                {usernameStatus === "checking" ? "Checking…" : usernameMsg}
              </div>
            )}
          </label>

          <div className="grid sm:grid-cols-2 gap-3">
            <label className="grid gap-1">
              <span className="label">First name</span>
              <input className="input" placeholder="Asha" value={firstName} onChange={(e)=>setFirstName(e.target.value)} />
            </label>
            <label className="grid gap-1">
              <span className="label">Last name</span>
              <input className="input" placeholder="Rao" value={lastName} onChange={(e)=>setLastName(e.target.value)} />
            </label>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="grid gap-1">
              <span className="label">Email (optional)</span>
              <input className="input" placeholder="you@example.com" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} />
            </label>
            <label className="grid gap-1">
              <span className="label">Phone</span>
              <input className="input" placeholder="+91 98765 43210" value={phone} onChange={(e)=>setPhone(e.target.value)} />
            </label>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="grid gap-1">
              <span className="label">City</span>
              <input className="input" placeholder="Bengaluru" value={city} onChange={(e)=>setCity(e.target.value)} />
            </label>
            <label className="grid gap-1">
              <span className="label">Country</span>
              <input className="input" placeholder="India" value={country} onChange={(e)=>setCountry(e.target.value)} />
            </label>
          </div>

          <label className="grid gap-1">
            <span className="label">Password</span>
            <input
              className="input"
              placeholder="••••••••"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="grid gap-1">
              <span className="label">Photo URL (optional)</span>
              <input className="input" placeholder="https://..." value={avatarUrl} onChange={(e)=>setAvatarUrl(e.target.value)} />
            </label>
            <label className="grid gap-1">
              <span className="label">Upload Photo (optional)</span>
              <input className="input" type="file" accept="image/*" onChange={(e)=>setAvatarFile(e.target.files?.[0] || null)} />
            </label>
          </div>
          <label className="grid gap-1">
            <span className="label">Additional information</span>
            <textarea className="input" rows={4} placeholder="Tell us a bit about your travel preferences" value={bio} onChange={(e)=>setBio(e.target.value)} />
          </label>

          {error && <div className="text-red-400 text-sm">{error}</div>}

          <button className="btn btn-primary" type="submit">Sign up</button>

          <div className="text-sm opacity-80">
            Already have an account? <a className="underline" href="/login">Sign in</a>
          </div>
      </form>
    </AuthCard>
  );
}

