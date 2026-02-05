import * as React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";

export type AuthDialogAction = {
  label: string;
  onPress: () => void;
  variant?: "default" | "outline";
};

type AuthErrorDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message: string;
  actions: AuthDialogAction[];
};

export default function AuthErrorDialog({
  open,
  onOpenChange,
  title,
  message,
  actions,
}: AuthErrorDialogProps) {
  const primary = actions[0];
  const secondary = actions.slice(1);

  const handleAction = (action: AuthDialogAction) => () => {
    onOpenChange(false);
    action.onPress();
  };

  if (!open) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{message}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {secondary.map((action) => (
            <AlertDialogCancel key={action.label} onPress={handleAction(action)}>
              {action.label}
            </AlertDialogCancel>
          ))}
          {primary ? (
            <AlertDialogAction onPress={handleAction(primary)}>{primary.label}</AlertDialogAction>
          ) : null}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
