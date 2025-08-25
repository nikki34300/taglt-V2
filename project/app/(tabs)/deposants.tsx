import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Plus, User, Phone, Package, CreditCard as Edit3, Trash2 } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Deposant {
  id: string;
  code: string;
  prenom: string;
  nom: string;
  telephone: string;
  dateCreation: string;
  nbArticles: number;
}

export default function DeposantsScreen() {
  const [deposants, setDeposants] = useState<Deposant[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingDeposant, setEditingDeposant] = useState<Deposant | null>(null);
  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    telephone: '',
  });

  useEffect(() => {
    loadDeposants();
  }, []);

  const loadDeposants = async () => {
    try {
      const stored = await AsyncStorage.getItem('deposants');
      if (stored) {
        setDeposants(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Erreur chargement déposants:', error);
    }
  };

  const generateCode = (prenom: string, nom: string): string => {
    const base = (prenom.substring(0, 2) + nom.substring(0, 1)).toUpperCase();
    const random = Math.floor(Math.random() * 10);
    return `${base}${random}`;
  };

  const saveDeposant = async () => {
    if (!formData.prenom || !formData.nom || !formData.telephone) {
      Alert.alert('Erreur', 'Tous les champs sont obligatoires');
      return;
    }

    try {
      let updatedDeposants = [...deposants];
      let generatedCode = '';

      if (editingDeposant) {
        // Modification
        const index = deposants.findIndex(d => d.id === editingDeposant.id);
        updatedDeposants[index] = {
          ...editingDeposant,
          ...formData,
        };
      } else {
        // Nouveau déposant
        generatedCode = generateCode(formData.prenom, formData.nom);
        const newDeposant: Deposant = {
          id: Date.now().toString(),
          code: generatedCode,
          ...formData,
          dateCreation: new Date().toLocaleDateString(),
          nbArticles: 0,
        };
        updatedDeposants.push(newDeposant);
      }

      await AsyncStorage.setItem('deposants', JSON.stringify(updatedDeposants));
      setDeposants(updatedDeposants);
      closeModal();

      Alert.alert(
        'Succès',
        editingDeposant
          ? 'Déposant modifié avec succès'
          : `Déposant créé avec le code: ${generatedCode}`
      );
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sauvegarder le déposant');
    }
  };

  const deleteDeposant = async (id: string) => {
    Alert.alert(
      'Confirmation',
      'Êtes-vous sûr de vouloir supprimer ce déposant ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedDeposants = deposants.filter(d => d.id !== id);
              await AsyncStorage.setItem('deposants', JSON.stringify(updatedDeposants));
              setDeposants(updatedDeposants);
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer le déposant');
            }
          },
        },
      ]
    );
  };

  const openModal = (deposant?: Deposant) => {
    if (deposant) {
      setEditingDeposant(deposant);
      setFormData({
        prenom: deposant.prenom,
        nom: deposant.nom,
        telephone: deposant.telephone,
      });
    } else {
      setEditingDeposant(null);
      setFormData({ prenom: '', nom: '', telephone: '' });
    }
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingDeposant(null);
    setFormData({ prenom: '', nom: '', telephone: '' });
  };

  const DeposantCard = ({ deposant }: { deposant: Deposant }) => (
    <View style={styles.deposantCard}>
      <View style={styles.deposantHeader}>
        <View style={styles.deposantInfo}>
          <View style={styles.codeContainer}>
            <Text style={styles.deposantCode}>{deposant.code}</Text>
          </View>
          <Text style={styles.deposantName}>
            {deposant.prenom} {deposant.nom}
          </Text>
          <View style={styles.deposantDetails}>
            <Phone size={16} color="#6B7280" />
            <Text style={styles.deposantPhone}>{deposant.telephone}</Text>
          </View>
          <View style={styles.deposantDetails}>
            <Package size={16} color="#6B7280" />
            <Text style={styles.deposantArticles}>{deposant.nbArticles} articles</Text>
          </View>
        </View>
        <View style={styles.deposantActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => openModal(deposant)}
          >
            <Edit3 size={18} color="#3B82F6" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => deleteDeposant(deposant.id)}
          >
            <Trash2 size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Déposants</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => openModal()}>
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {deposants.length === 0 ? (
          <View style={styles.emptyState}>
            <User size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>Aucun déposant</Text>
            <Text style={styles.emptySubtitle}>
              Commencez par créer votre premier déposant
            </Text>
          </View>
        ) : (
          deposants.map((deposant) => (
            <DeposantCard key={deposant.id} deposant={deposant} />
          ))
        )}
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingDeposant ? 'Modifier déposant' : 'Nouveau déposant'}
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Prénom</Text>
              <TextInput
                style={styles.input}
                value={formData.prenom}
                onChangeText={(text) => setFormData({ ...formData, prenom: text })}
                placeholder="Prénom"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nom</Text>
              <TextInput
                style={styles.input}
                value={formData.nom}
                onChangeText={(text) => setFormData({ ...formData, nom: text })}
                placeholder="Nom"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Téléphone</Text>
              <TextInput
                style={styles.input}
                value={formData.telephone}
                onChangeText={(text) => setFormData({ ...formData, telephone: text })}
                placeholder="Téléphone"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={closeModal}>
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={saveDeposant}>
                <Text style={styles.saveButtonText}>
                  {editingDeposant ? 'Modifier' : 'Créer'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  addButton: {
    backgroundColor: '#3B82F6',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#D1D5DB',
    textAlign: 'center',
    marginTop: 8,
  },
  deposantCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  deposantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  deposantInfo: {
    flex: 1,
  },
  codeContainer: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  deposantCode: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  deposantName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  deposantDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  deposantPhone: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  deposantArticles: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  deposantActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#EBF4FF',
  },
  deleteButton: {
    backgroundColor: '#FEF2F2',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 24,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});