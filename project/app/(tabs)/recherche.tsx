import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  SafeAreaView,
} from 'react-native';
import { Search, Filter, Package, User, MapPin } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Article {
  id: string;
  code: string;
  deposantCode: string;
  deposantNom: string;
  photo: string;
  taille: string;
  sexe: string;
  prix: number;
  emplacement?: string;
  vendu: boolean;
}

export default function RechercheScreen() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    taille: '',
    sexe: '',
    prixMin: '',
    prixMax: '',
    vendu: 'tous',
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadArticles();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, filters, articles]);

  const loadArticles = async () => {
    try {
      const stored = await AsyncStorage.getItem('articles');
      if (stored) {
        const articlesList = JSON.parse(stored);
        setArticles(articlesList);
        setFilteredArticles(articlesList);
      }
    } catch (error) {
      console.error('Erreur chargement articles:', error);
    }
  };

  const applyFilters = () => {
    let filtered = articles;

    // Recherche textuelle
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(article =>
        article.code.toLowerCase().includes(query) ||
        article.deposantCode.toLowerCase().includes(query) ||
        article.deposantNom.toLowerCase().includes(query) ||
        article.taille.toLowerCase().includes(query) ||
        article.sexe.toLowerCase().includes(query)
      );
    }

    // Filtres
    if (filters.taille) {
      filtered = filtered.filter(article => article.taille === filters.taille);
    }

    if (filters.sexe) {
      filtered = filtered.filter(article => article.sexe === filters.sexe);
    }

    if (filters.prixMin !== '' && !isNaN(parseFloat(filters.prixMin))) {
      filtered = filtered.filter(article => article.prix >= parseFloat(filters.prixMin));
    }

    if (filters.prixMax !== '' && !isNaN(parseFloat(filters.prixMax))) {
      filtered = filtered.filter(article => article.prix <= parseFloat(filters.prixMax));
    }

    if (filters.vendu !== 'tous') {
      filtered = filtered.filter(article => 
        filters.vendu === 'vendu' ? article.vendu : !article.vendu
      );
    }

    setFilteredArticles(filtered);
  };

  const resetFilters = () => {
    setFilters({
      taille: '',
      sexe: '',
      prixMin: '',
      prixMax: '',
      vendu: 'tous',
    });
    setSearchQuery('');
  };

  const getUniqueValues = (key: keyof Article) => {
    return [...new Set(articles.map(article => article[key] as string))];
  };

  const FilterButton = ({ 
    label, 
    value, 
    onPress, 
    active 
  }: {
    label: string;
    value: string;
    onPress: () => void;
    active: boolean;
  }) => (
    <TouchableOpacity
      style={[styles.filterButton, active && styles.filterButtonActive]}
      onPress={onPress}
    >
      <Text style={[styles.filterButtonText, active && styles.filterButtonTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const ArticleCard = ({ article }: { article: Article }) => (
    <View style={[styles.articleCard, article.vendu && styles.articleVendu]}>
      <Image source={{ uri: article.photo }} style={styles.articleImage} />
      <View style={styles.articleInfo}>
        <View style={styles.articleHeader}>
          <Text style={styles.articleCode}>{article.code}</Text>
          <Text style={[styles.articlePrice, article.vendu && styles.articlePriceVendu]}>
            {article.prix}€
          </Text>
        </View>
        
        <View style={styles.articleDetails}>
          <Text style={styles.articleTaille}>{article.taille}</Text>
          <Text style={styles.articleSexe}>{article.sexe}</Text>
        </View>

        <View style={styles.articleDeposant}>
          <User size={16} color="#6B7280" />
          <Text style={styles.articleDeposantText}>
            {article.deposantCode} - {article.deposantNom}
          </Text>
        </View>

        {article.emplacement && (
          <View style={styles.articleEmplacement}>
            <MapPin size={16} color="#6B7280" />
            <Text style={styles.articleEmplacementText}>{article.emplacement}</Text>
          </View>
        )}

        {article.vendu && (
          <View style={styles.venduBadge}>
            <Text style={styles.venduText}>VENDU</Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Rechercher</Text>
        <TouchableOpacity 
          style={styles.filterToggle}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Filter size={24} color={showFilters ? '#3B82F6' : '#6B7280'} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Code article, déposant..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {showFilters && (
        <View style={styles.filtersContainer}>
          <Text style={styles.filtersTitle}>Filtres</Text>
          
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Taille</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filterRow}>
                {getUniqueValues('taille').map(taille => (
                  <FilterButton
                    key={taille}
                    label={taille}
                    value={taille}
                    active={filters.taille === taille}
                    onPress={() => setFilters({ ...filters, taille: filters.taille === taille ? '' : taille })}
                  />
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Sexe</Text>
            <View style={styles.filterRow}>
              {getUniqueValues('sexe').map(sexe => (
                <FilterButton
                  key={sexe}
                  label={sexe}
                  value={sexe}
                  active={filters.sexe === sexe}
                  onPress={() => setFilters({ ...filters, sexe: filters.sexe === sexe ? '' : sexe })}
                />
              ))}
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Prix</Text>
            <View style={styles.priceFilters}>
              <TextInput
                style={styles.priceInput}
                placeholder="Min"
                value={filters.prixMin}
                onChangeText={(text) => setFilters({ ...filters, prixMin: text })}
                keyboardType="numeric"
              />
              <Text style={styles.priceSeparator}>-</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="Max"
                value={filters.prixMax}
                onChangeText={(text) => setFilters({ ...filters, prixMax: text })}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Statut</Text>
            <View style={styles.filterRow}>
              {[
                { label: 'Tous', value: 'tous' },
                { label: 'Disponible', value: 'disponible' },
                { label: 'Vendu', value: 'vendu' },
              ].map(status => (
                <FilterButton
                  key={status.value}
                  label={status.label}
                  value={status.value}
                  active={filters.vendu === status.value}
                  onPress={() => setFilters({ ...filters, vendu: status.value })}
                />
              ))}
            </View>
          </View>

          <TouchableOpacity style={styles.resetButton} onPress={resetFilters}>
            <Text style={styles.resetButtonText}>Réinitialiser les filtres</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {filteredArticles.length} résultat{filteredArticles.length > 1 ? 's' : ''}
        </Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {filteredArticles.length === 0 ? (
          <View style={styles.emptyState}>
            <Package size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>Aucun article trouvé</Text>
            <Text style={styles.emptySubtitle}>
              Modifiez vos critères de recherche
            </Text>
          </View>
        ) : (
          filteredArticles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))
        )}
      </ScrollView>
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
  filterToggle: {
    padding: 8,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
    color: '#1F2937',
  },
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filtersTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  priceFilters: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priceInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#F9FAFB',
    fontSize: 16,
  },
  priceSeparator: {
    fontSize: 16,
    color: '#6B7280',
  },
  resetButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#EF4444',
    borderRadius: 8,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  resultsHeader: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  resultsCount: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
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
  articleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  articleVendu: {
    opacity: 0.6,
  },
  articleImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  articleInfo: {
    flex: 1,
    marginLeft: 16,
    position: 'relative',
  },
  articleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  articleCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  articlePrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
  },
  articlePriceVendu: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
  articleDetails: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  articleTaille: {
    fontSize: 14,
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  articleSexe: {
    fontSize: 14,
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  articleDeposant: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  articleDeposantText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 6,
  },
  articleEmplacement: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  articleEmplacementText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 6,
  },
  venduBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  venduText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});