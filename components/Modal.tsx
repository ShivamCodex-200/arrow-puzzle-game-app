import React from 'react';
import { Modal as RNModal, View, Pressable, StyleSheet } from 'react-native';

interface Props {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const Modal: React.FC<Props> = ({ visible, onClose, children }) => {
  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.card}>
          {children}
        </View>
      </View>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    zIndex: 10,
  },
});
