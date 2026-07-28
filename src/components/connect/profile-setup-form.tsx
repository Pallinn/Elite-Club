"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TagPicker } from "@/components/connect/tag-picker";
import { CONNECT_MIN_AGE, connectPhotoSrc } from "@/lib/connect-tags";
import { cn } from "@/lib/utils";
import type { ConnectProfile } from "@/generated/prisma/client";

const GENDER_OPTIONS = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER", label: "Other" },
] as const;

const SHOW_ME_OPTIONS = [
  { value: "MALE", label: "Men" },
  { value: "FEMALE", label: "Women" },
  { value: "EVERYONE", label: "Everyone" },
] as const;

function ToggleGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly { value: T; label: string }[];
  value: T | null;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "flex-1 rounded-lg border px-3 py-2 text-sm transition-colors",
            value === opt.value
              ? "border-orange-500 bg-orange-500/20 text-orange-300"
              : "border-white/10 text-neutral-400 hover:border-white/30 hover:text-white"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function ProfileSetupForm({
  initialProfile,
  onSaved,
}: {
  initialProfile?: ConnectProfile | null;
  onSaved: () => void;
}) {
  const [nickname, setNickname] = useState(initialProfile?.nickname ?? "");
  const [age, setAge] = useState(initialProfile?.age?.toString() ?? "");
  const [description, setDescription] = useState(initialProfile?.description ?? "");
  const [instagram, setInstagram] = useState(initialProfile?.instagram ?? "");
  const [gender, setGender] = useState<"MALE" | "FEMALE" | "OTHER" | null>(
    initialProfile?.gender ?? null
  );
  const [showMe, setShowMe] = useState<"MALE" | "FEMALE" | "EVERYONE" | null>(
    initialProfile?.showMe ?? null
  );
  const [tags, setTags] = useState<string[]>(initialProfile?.tags ?? []);
  const [photoPreview, setPhotoPreview] = useState(
    initialProfile?.photoUrl ? connectPhotoSrc(initialProfile.photoUrl) : ""
  );
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!gender || !showMe) {
      toast.error("Select your gender and who you want to see");
      return;
    }
    setSaving(true);
    try {
      let finalPhotoUrl = initialProfile?.photoUrl ?? "";
      if (photoFile) {
        const formData = new FormData();
        formData.append("file", photoFile);
        const uploadRes = await fetch("/api/connect/upload", { method: "POST", body: formData });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          toast.error(uploadData.error ?? "Photo upload failed");
          setSaving(false);
          return;
        }
        finalPhotoUrl = uploadData.url;
      }
      if (!finalPhotoUrl) {
        toast.error("Upload a profile photo");
        setSaving(false);
        return;
      }

      const res = await fetch("/api/connect/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname,
          age: Number(age),
          description,
          instagram,
          gender,
          showMe,
          photoUrl: finalPhotoUrl,
          tags,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Something went wrong");
        setSaving(false);
        return;
      }
      toast.success("Profile saved");
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-md space-y-5">
      <div className="space-y-2">
        <Label>Profile photo</Label>
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border border-white/10 bg-neutral-900">
            {photoPreview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoPreview} alt="Profile preview" className="h-full w-full object-cover" />
            )}
          </div>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handlePhotoChange}
            className="text-xs text-neutral-400 file:mr-3 file:rounded-lg file:border file:border-white/10 file:bg-transparent file:px-3 file:py-1.5 file:text-xs file:text-white"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="nickname">Nickname</Label>
        <Input id="nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} maxLength={40} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="age">Age</Label>
        <Input
          id="age"
          type="number"
          min={CONNECT_MIN_AGE}
          max={99}
          value={age}
          onChange={(e) => setAge(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">About you</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={500}
          rows={3}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="instagram">Instagram</Label>
        <Input
          id="instagram"
          value={instagram}
          onChange={(e) => setInstagram(e.target.value)}
          placeholder="yourhandle"
          required
        />
      </div>

      <div className="space-y-2">
        <Label>I am</Label>
        <ToggleGroup options={GENDER_OPTIONS} value={gender} onChange={setGender} />
      </div>

      <div className="space-y-2">
        <Label>Show me</Label>
        <ToggleGroup options={SHOW_ME_OPTIONS} value={showMe} onChange={setShowMe} />
      </div>

      <div className="space-y-2">
        <Label>Interests</Label>
        <TagPicker selected={tags} onChange={setTags} />
      </div>

      <Button type="submit" disabled={saving} className="w-full">
        {saving ? "Saving..." : "Save & continue"}
      </Button>
    </form>
  );
}
