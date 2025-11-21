import { useState } from "react";
import { CustomAlert } from "@/components/ui/CustomAlert";
import React from "react";

interface AlertOptions {
  title: string;
  message: string;
  type?: "success" | "error" | "info";
  confirmText?: string;
  onConfirm?: () => void;
}

export const useCustomAlert = (): {
  showAlert: (options: AlertOptions) => void;
  hideAlert: () => void;
  AlertComponent: React.FC;
} => {
  const [alertState, setAlertState] = useState<AlertOptions & { visible: boolean }>({
    visible: false,
    title: "",
    message: "",
    type: "info",
  });

  const showAlert = (options: AlertOptions) => {
    setAlertState({
      ...options,
      visible: true,
    });
  };

  const hideAlert = () => {
    setAlertState((prev) => ({
      ...prev,
      visible: false,
    }));
  };

  const AlertComponent = () => (
    <CustomAlert
      visible={alertState.visible}
      title={alertState.title}
      message={alertState.message}
      type={alertState.type}
      onClose={hideAlert}
      confirmText={alertState.confirmText}
      onConfirm={alertState.onConfirm}
    />
  );

  return {
    showAlert,
    hideAlert,
    AlertComponent,
  };
};

