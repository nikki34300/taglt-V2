import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { QrCode, Camera, Users, Package, ShoppingCart } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ScannedData {
  type: 'deposant' | 'article';
  code: string;
  data?: any;
}

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [scanned, setScanned] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [scannedData, setScannedData] = useState<ScannedData | null>(null);
  const [scanMode, setScanMode] = useState<'check-in' | 'vente'>('check-in');

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <View style={styles.permissionContent}>
          <QrCode size={80} color="#3B82F6" />
          <Text style={styles.permissionTitle}>Autorisation caméra requise</Text>
          <Text style={styles.permissionMessage}>
            TagIt a besoin d'accéder à votre caméra pour scanner les QR codes
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Autoriser la caméra</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;

    setScanned(true);
    
    try {
      // Analyse du QR code scanné
      if (data.includes('-')) {
        // Code article (ex: ABC7-001)
        const [deposantCode, articleNum] = data.split('-');
        const articles = await AsyncStorage.getItem('articles');
        const articlesList = articles ? JSON.parse(articles) : [];
        
        const article = articlesList.find((a: any) => a.code === data);
        
        setScannedData({
          type: 'article',
          code: data,
          data: article,
        });
      } else {
        // Code déposant (ex: ABC7)
        const deposants = await AsyncStorage.getItem('deposants');
        const deposantsList = deposants ? JSON.parse(deposants) : [];
        
        const deposant = deposantsList.find((d: any) => d.code === data);
        
        setScannedData({
          type: 'deposant',
          code: data,
          data: deposant,
        });
      }
      
      setModalVisible(true);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de traiter le QR code scanné');
      setScanned(false);
    }
  };

  const handleCheckIn = async () => {
    if (!scannedData?.data) {
      Alert.alert('Erreur', 'Données invalides');
      return;
    }

    try {
      if (scannedData.type === 'deposant') {
        // Check-in déposant
        const deposants = await AsyncStorage.getItem('deposants');
        const deposantsList = deposants ? JSON.parse(deposants) : [];
        
        const updatedDeposants = deposantsList.map((d: any) => 
          d.code === scannedData.code 
            ? { ...d, checkIn: true, checkInDate: new Date().toISOString() }
            : d
        );
        
        await AsyncStorage.setItem('deposants', JSON.stringify(updatedDeposants));
        Alert.alert('Check-in réussi', `${scannedData.data.prenom} ${scannedData.data.nom} a été enregistré`);
      }
      
      closeModal();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de procéder au check-in');
    }
  };

  const handleVente = async () => {
    if (!scannedData?.data || scannedData.type !== 'article') {
      Alert.alert('Erreur', 'Seuls les articles peuvent être vendus');
      return;
    }

    try {
      // Ajouter à un panier de vente (temporaire)
      const panier = await AsyncStorage.getItem('panier_temporaire');
      const panierActuel = panier ? JSON.parse(panier) : [];
      
      panierActuel.push(scannedData.data);
      await AsyncStorage.setItem('panier_temporaire', JSON.stringify(panierActuel));
      
      Alert.alert('Article ajouté', 'Article ajouté au panier de vente');
      closeModal();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'ajouter l\'article au panier');
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setScannedData(null);
    setScanned(false);
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const ScanModeButton = ({ 
    mode, 
    icon: Icon, 
    title, 
    active 
  }: {
    mode: 'check-in' | 'vente';
    icon: any;
    title: string;
    active: boolean;
  }) => (
    <TouchableOpacity
      style={[styles.modeButton, active && styles.modeButtonActive]}
      onPress={() => setScanMode(mode)}
    >
      <Icon size={24} color={active ? '#FFFFFF' : '#6B7280'} />
      <Text style={[styles.modeButtonText, active && styles.modeButtonTextActive]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Scanner QR Code</Text>
        <View style={styles.modeSelector}>
          <ScanModeButton
            mode="check-in"
            icon={Users}
            title="Check-in"
            active={scanMode === 'check-in'}
          />
          <ScanModeButton
            mode="vente"
            icon={ShoppingCart}
            title="Vente"
            active={scanMode === 'vente'}
          />
        </View>
      </View>

      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing={facing}
          onBarcodeScanned={handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
        >
          <View style={styles.overlay}>
            <View style={styles.scanArea}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
            
            <View style={styles.cameraControls}>
              <TouchableOpacity style={styles.flipButton} onPress={toggleCameraFacing}>
                <Camera size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </CameraView>
      </View>

      <View style={styles.instructions}>
        <Text style={styles.instructionTitle}>
          {scanMode === 'check-in' ? 'Mode Check-in' : 'Mode Vente'}
        </Text>
        <Text style={styles.instructionText}>
          {scanMode === 'check-in' 
            ? 'Scannez le QR code du déposant pour l\'enregistrer'
            : 'Scannez le QR code de l\'article à vendre'
          }
        </Text>
      </View>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {scannedData && (
              <>
                <View style={styles.modalHeader}>
                  {scannedData.type === 'deposant' ? (
                    <Users size={32} color="#3B82F6" />
                  ) : (
                    <Package size={32} color="#10B981" />
                  )}
                  <Text style={styles.modalTitle}>
                    {scannedData.type === 'deposant' ? 'Déposant trouvé' : 'Article trouvé'}
                  </Text>
                </View>

                {scannedData.data ? (
                  <View style={styles.modalData}>
                    <Text style={styles.modalCode}>{scannedData.code}</Text>
                    {scannedData.type === 'deposant' ? (
                      <Text style={styles.modalName}>
                        {scannedData.data.prenom} {scannedData.data.nom}
                      </Text>
                    ) : (
                      <>
                        <Text style={styles.modalArticleInfo}>
                          {scannedData.data.taille} - {scannedData.data.sexe}
                        </Text>
                        <Text style={styles.modalPrice}>
                          {scannedData.data.prix}€
                        </Text>
                      </>
                    )}
                  </View>
                ) : (
                  <Text style={styles.modalError}>
                    {scannedData.type === 'deposant' ? 'Déposant' : 'Article'} non trouvé
                  </Text>
                )}

                <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.modalCancelButton} onPress={closeModal}>
                    <Text style={styles.modalCancelText}>Annuler</Text>
                  </TouchableOpacity>
                  
                  {scannedData.data && (
                    <TouchableOpacity
                      style={styles.modalActionButton}
                      onPress={scanMode === 'check-in' ? handleCheckIn : handleVente}
                    >
                      <Text style={styles.modalActionText}>
                        {scanMode === 'check-in' ? 'Check-in' : 'Ajouter au panier'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  permissionContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  permissionButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  modeSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    backgroundColor: '#F3F4F6',
  },
  modeButtonActive: {
    backgroundColor: '#3B82F6',
  },
  modeButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  modeButtonTextActive: {
    color: '#FFFFFF',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#3B82F6',
    borderWidth: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  cameraControls: {
    position: 'absolute',
    bottom: 40,
    right: 20,
  },
  flipButton: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructions: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    alignItems: 'center',
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 12,
  },
  modalData: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalCode: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginBottom: 8,
  },
  modalName: {
    fontSize: 18,
    color: '#1F2937',
    fontWeight: '500',
  },
  modalArticleInfo: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 4,
  },
  modalPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10B981',
  },
  modalError: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  modalActionButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
  },
  modalActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});