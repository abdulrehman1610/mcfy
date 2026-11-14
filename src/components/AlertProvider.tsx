import React, { useEffect, useState } from "react";
import {
  Alert,
  AlertButton,
  AlertOptions,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { BorderRadius, Colors, Layout, Spacing } from "../constants/theme";

interface DialogRequest {
  title: string;
  message?: string;
  buttons: AlertButton[];
  cancelable: boolean;
}

type DialogListener = (request: DialogRequest) => void;

let activeListener: DialogListener | null = null;

/**
 * Cross-platform alert dialog helper.
 * Uses native Alert.alert on iOS/Android and an in-app dark modal on Web
 * (where react-native-web's Alert.alert is a no-op).
 */
export function showAppAlert(
  title: string,
  message?: string,
  buttons?: AlertButton[],
  options?: AlertOptions
): void {
  if (Platform.OS !== "web") {
    Alert.alert(title, message, buttons, options);
    return;
  }

  const resolvedButtons: AlertButton[] =
    buttons && buttons.length > 0 ? buttons : [{ text: "OK" }];

  if (activeListener) {
    activeListener({
      title,
      message,
      buttons: resolvedButtons,
      cancelable: options?.cancelable ?? true,
    });
  } else if (typeof window !== "undefined") {
    // Fallback before provider mounts
    window.alert(message ? `${title}\n\n${message}` : title);
    resolvedButtons[0]?.onPress?.();
  }
}

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [dialog, setDialog] = useState<DialogRequest | null>(null);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    activeListener = (req) => setDialog(req);
    return () => {
      activeListener = null;
    };
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web" || !dialog || typeof window === "undefined") return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && dialog.cancelable) {
        const cancelButton = dialog.buttons.find((b) => b.style === "cancel");
        setDialog(null);
        cancelButton?.onPress?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dialog]);

  const handleButtonPress = (button: AlertButton) => {
    setDialog(null);
    button.onPress?.();
  };

  const handleDismiss = () => {
    if (!dialog?.cancelable) return;
    const cancelButton = dialog.buttons.find((b) => b.style === "cancel");
    setDialog(null);
    cancelButton?.onPress?.();
  };

  return (
    <>
      {children}
      {Platform.OS === "web" && dialog && (
        <Modal
          visible
          transparent
          animationType="fade"
          onRequestClose={handleDismiss}
        >
          <Pressable style={styles.overlay} onPress={handleDismiss}>
            <Pressable
              style={styles.card}
              onPress={(e) => e.stopPropagation()}
            >
              <Text style={styles.title}>{dialog.title}</Text>
              {!!dialog.message && (
                <Text style={styles.message}>{dialog.message}</Text>
              )}
              <View style={styles.actions}>
                {dialog.buttons.map((button, index) => {
                  const isCancel = button.style === "cancel";
                  const isDestructive = button.style === "destructive";
                  const isPrimary =
                    !isCancel &&
                    !isDestructive &&
                    index === dialog.buttons.length - 1;

                  return (
                    <TouchableOpacity
                      key={`${button.text ?? "btn"}-${index}`}
                      style={[
                        styles.button,
                        isCancel && styles.cancelButton,
                        isDestructive && styles.destructiveButton,
                        isPrimary && styles.primaryButton,
                        !isCancel &&
                          !isDestructive &&
                          !isPrimary &&
                          styles.defaultButton,
                      ]}
                      onPress={() => handleButtonPress(button)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.buttonText,
                          isCancel && styles.cancelText,
                          isDestructive && styles.destructiveText,
                          isPrimary && styles.primaryText,
                        ]}
                      >
                        {button.text || "OK"}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  card: {
    width: "100%",
    maxWidth: Layout.maxModalWidth,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  title: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: "800",
    marginBottom: Spacing.sm,
  },
  message: {
    color: Colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  button: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    minWidth: 92,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  defaultButton: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  primaryButton: {
    backgroundColor: Colors.primary,
  },
  destructiveButton: {
    backgroundColor: Colors.error,
  },
  buttonText: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  cancelText: {
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  primaryText: {
    color: "#000000",
    fontWeight: "800",
  },
  destructiveText: {
    color: "#ffffff",
    fontWeight: "800",
  },
});

