'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { userService } from '@/services/user.service';
import { useAuthStore } from '@/store/authStore';
import { getErrorMessage } from '@/services/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function ProfilePage() {
  const { user, setAuth, token } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [avatarError, setAvatarError] = useState(false);

  const updateMutation = useMutation({
    mutationFn: () => userService.updateMe({ name, bio, avatar: avatar.trim() || '' }),
    onSuccess: (res) => {
      if (token) setAuth(res.data.data!, token);
      setAvatarError(false);
      toast.success('Profile updated');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const showAvatarImage = avatar.trim() && !avatarError;

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-2xl font-bold">Profile</h1>
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-6 flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-indigo-100 text-2xl font-bold text-indigo-600">
          {showAvatarImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatar.trim()}
              alt={user?.name || 'Avatar'}
              className="h-full w-full object-cover"
              onError={() => setAvatarError(true)}
            />
          ) : (
            user?.name?.charAt(0).toUpperCase()
          )}
        </div>
        <p className="mb-4 text-sm text-slate-500">{user?.email}</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateMutation.mutate();
          }}
          className="space-y-4"
        >
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input
            label="Avatar URL"
            type="url"
            value={avatar}
            onChange={(e) => {
              setAvatar(e.target.value);
              setAvatarError(false);
            }}
            placeholder="https://example.com/avatar.jpg"
          />
          <p className="text-xs text-slate-500">Paste a link to an image. Leave empty to use your initial.</p>
          <div>
            <label className="mb-1 block text-sm font-medium">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            />
          </div>
          <Button type="submit" loading={updateMutation.isPending}>
            Save changes
          </Button>
        </form>
      </div>
    </div>
  );
}
