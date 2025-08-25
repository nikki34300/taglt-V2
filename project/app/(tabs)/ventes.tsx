import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Modal,
} from 'react-native';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  Receipt,
  TrendingUp 
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Article {
  id: string;
  code: string;
  deposantCode: string;
  deposantNom: string;
  prix: number;
  taille: string;
  sexe: string;
}

interface PanierItem extends Article {
  quantite: number;
}

interface Vente {
  id: string;
  articles: PanierItem[];
  total: number;
  date: string;
  ticketNumber: string;
}

export default function VentesScreen() {
  const [panier, setPanier] = useState<PanierItem[]>([]);
  const [ventes, setVentes] = useState<Vente[]>([]);
  const [total, setTotal] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [ticketNumber, setTicketNumber] = useState('');

  useEffect(() => {
    loadPanier();
    loadVentes();
  }, []);

  useEffect(() => {
    calculateTotal();
  }, [panier]);

  const loadPanier = async () => {
    try {
      const stored = await AsyncStorage.getItem('panier_temporaire');
      if (stored) {
        const articles = JSON.parse(stored);
        const panierGrouped = groupArticles(articles);
        setPanier(panierGrouped);
      }
    } catch (error) {
      console.error('Erreur chargement panier:', error);
    }
  };

  const loadVentes = async () => {
    try {
      const stored = await AsyncStorage.getItem('ventes');
      if (stored) {
        setVentes(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Erreur chargement ventes:', error);
    }
  };

  const groupArticles = (articles: Article[]): PanierItem[] => {
    const grouped: { [key: string]: PanierItem } = {};
    
    articles.forEach(article => {
      if (grouped[article.code]) {
        grouped[article.code].quantite += 1;
      } else {
        grouped[article.code] = { ...article, quantite: 1 };
      }
    });

    return Object.values(grouped);
  };

  const calculateTotal = () => {
    const newTotal = panier.reduce((sum, item) => sum + (item.prix * item.quantite), 0);
    setTotal(newTotal);
  };

  const updateQuantity = async (articleCode: string, change: number) => {
    const updatedPanier = panier.map(item => {
      if (item.code === articleCode) {
        const newQuantite = Math.max(0, item.quantite + change);
        return { ...item, quantite: newQuantite };
      }
      return item;
    }).filter(item => item.quantite > 0);

    setPanier(updatedPanier);
    
    // Mettre à jour le stockage temporaire
    const articlesFlat = updatedPanier.flatMap(item => 
      Array(item.quantite).fill({
        id: item.id,
        code: item.code,
        deposantCode: item.deposantCode,
        deposantNom: item.deposantNom,
        prix: item.prix,
        taille: item.taille,
        sexe: item.sexe,
      })
    );
    
    await AsyncStorage.setItem('panier_temporaire', JSON.stringify(articlesFlat));
  };

  const removeFromPanier = async (articleCode: string) => {
    const updatedPanier = panier.filter(item => item.code !== articleCode);
    setPanier(updatedPanier);
    
    const articlesFlat = updatedPanier.flatMap(item => 
      Array(item.quantite).fill({
        id: item.id,
        code: item.code,
        deposantCode: item.deposantCode,
        deposantNom: item.deposantNom,
        prix: item.prix,
        taille: item.taille,
        sexe: item.sexe,
      })
    );
    
    await AsyncStorage.setItem('panier_temporaire', JSON.stringify(articlesFlat));
  };

  const clearPanier = async () => {
    setPanier([]);
    await AsyncStorage.removeItem('panier_temporaire');
  };

  const generateTicketNumber = () => {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = date.toTimeString().slice(0, 8).replace(/:/g, '');
    return `T${dateStr}${timeStr}`;
  };

  const processVente = async () => {
    if (panier.length === 0) {
      Alert.alert('Erreur', 'Le panier est vide');
      return;
    }

    try {
      const newTicketNumber = generateTicketNumber();
      const newVente: Vente = {
        id: Date.now().toString(),
        articles: [...panier],
        total: total,
        date: new Date().toISOString(),
        ticketNumber: newTicketNumber,
      };

      // Sauvegarder la vente
      const ventes = await AsyncStorage.getItem('ventes');
      const ventesList = ventes ? JSON.parse(ventes) : [];
      ventesList.push(newVente);
      await AsyncStorage.setItem('ventes', JSON.stringify(ventesList));

      // Marquer les articles comme vendus
      const articles = await AsyncStorage.getItem('articles');
      const articlesList = articles ? JSON.parse(articles) : [];
      const updatedArticles = articlesList.map((article: any) => {
        const panierItem = panier.find(item => item.code === article.code);
        if (panierItem) {
          return { ...article, vendu: true, dateVente: new Date().toISOString() };
        }
        return article;
      });
      await AsyncStorage.setItem('articles', JSON.stringify(updatedArticles));

      setTicketNumber(newTicketNumber);
      setModalVisible(true);
      await clearPanier();
      loadVentes();

    } catch (error) {
      Alert.alert('Erreur', 'Impossible de traiter la vente');
    }
  };

  const PanierItem = ({ item }: { item: PanierItem }) => (
    <View style={styles.panierItem}>
      <View style={styles.panierItemInfo}>
        <Text style={styles.panierItemCode}>{item.code}</Text>
        <Text style={styles.panierItemDetails}>
          {item.taille} - {item.sexe} - {item.deposantCode}
        </Text>
        <Text style={styles.panierItemPrice}>{item.prix}€</Text>
      </View>
      
      <View style={styles.panierItemControls}>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => updateQuantity(item.code, -1)}
        >
          <Minus size={16} color="#6B7280" />
        </TouchableOpacity>
        
        <Text style={styles.quantityText}>{item.quantite}</Text>
        
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => updateQuantity(item.code, 1)}
        >
          <Plus size={16} color="#6B7280" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => removeFromPanier(item.code)}
        >
          <Trash2 size={16} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const VenteCard = ({ vente }: { vente: Vente }) => (
    <View style={styles.venteCard}>
      <View style={styles.venteHeader}>
        <View>
          <Text style={styles.venteTicket}>{vente.ticketNumber}</Text>
          <Text style={styles.venteDate}>
            {new Date(vente.date).toLocaleDateString()} à {new Date(vente.date).toLocaleTimeString()}
          </Text>
        </View>
        <Text style={styles.venteTotal}>{vente.total.toFixed(2)}€</Text>
      </View>
      
      <Text style={styles.venteArticles}>
        {vente.articles.length} article{vente.articles.length > 1 ? 's' : ''}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Ventes</Text>
        <View style={styles.headerRight}>
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>{total.toFixed(2)}€</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Panier actuel</Text>
          
          {panier.length === 0 ? (
            <View style={styles.emptyPanier}>
              <ShoppingCart size={48} color="#D1D5DB" />
              <Text style={styles.emptyPanierText}>Panier vide</Text>
              <Text style={styles.emptyPanierSubtext}>
                Scannez des articles pour les ajouter
              </Text>
            </View>
          ) : (
            <>
              {panier.map((item) => (
                <PanierItem key={item.code} item={item} />
              ))}
              
              <View style={styles.panierActions}>
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => {
                    Alert.alert(
                      'Vider le panier',
                      'Êtes-vous sûr de vouloir vider le panier ?',
                      [
                        { text: 'Annuler', style: 'cancel' },
                        { text: 'Vider', style: 'destructive', onPress: clearPanier },
                      ]
                    );
                  }}
                >
                  <Text style={styles.clearButtonText}>Vider</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.checkoutButton}
                  onPress={processVente}
                >
                  <CreditCard size={20} color="#FFFFFF" />
                  <Text style={styles.checkoutButtonText}>Encaisser</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Historique des ventes</Text>
          
          {ventes.length === 0 ? (
            <View style={styles.emptyVentes}>
              <TrendingUp size={48} color="#D1D5DB" />
              <Text style={styles.emptyVentesText}>Aucune vente</Text>
            </View>
          ) : (
            ventes.slice().reverse().map((vente) => (
              <VenteCard key={vente.id} vente={vente} />
            ))
          )}
        </View>
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Receipt size={64} color="#10B981" />
            <Text style={styles.modalTitle}>Vente réalisée !</Text>
            <Text style={styles.modalTicket}>Ticket: {ticketNumber}</Text>
            <Text style={styles.modalTotal}>Total: {total.toFixed(2)}€</Text>
            
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Fermer</Text>
            </TouchableOpacity>
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
  headerRight: {
    alignItems: 'flex-end',
  },
  totalContainer: {
    alignItems: 'flex-end',
  },
  totalLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10B981',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  emptyPanier: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
  },
  emptyPanierText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 12,
  },
  emptyPanierSubtext: {
    fontSize: 14,
    color: '#D1D5DB',
    marginTop: 4,
  },
  panierItem: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  panierItemInfo: {
    flex: 1,
  },
  panierItemCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  panierItemDetails: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  panierItemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
  },
  panierItemControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    minWidth: 24,
    textAlign: 'center',
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  panierActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  checkoutButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    gap: 8,
  },
  checkoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyVentes: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  emptyVentesText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 12,
  },
  venteCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  venteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  venteTicket: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  venteDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  venteTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
  },
  venteArticles: {
    fontSize: 14,
    color: '#6B7280',
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
    padding: 32,
    alignItems: 'center',
    width: '90%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 16,
  },
  modalTicket: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 8,
  },
  modalTotal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 24,
  },
  modalButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});