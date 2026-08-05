import ChangePasswordForm from "./ChangePasswordForm";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold text-foreground">
          Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Portal configuration and preferences
        </p>
      </div>
      <ChangePasswordForm />
    </div>
  );
}
