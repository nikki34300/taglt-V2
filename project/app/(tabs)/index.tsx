import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView 
} from 'react-native';
import { Package, Users, TrendingUp, FileText, CircleAlert as AlertCircle } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Stats {
  deposants: number;
  articles: number;
  vendu: number;
  chiffre: number;
}

export default function AccueilScreen() {
  const [stats, setStats] = useState<Stats>({
    deposants: 0,
    articles: 0,
    vendu: 0,
    chiffre: 0
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const deposants = await AsyncStorage.getItem('deposants');
      const articles = await AsyncStorage.getItem('articles');
      const ventes = await AsyncStorage.getItem('ventes');
      
      const deposantsList = deposants ? JSON.parse(deposants) : [];
      const articlesList = articles ? JSON.parse(articles) : [];
      const ventesList = ventes ? JSON.parse(ventes) : [];
      
      const chiffre = ventesList.reduce((sum: number, vente: any) => sum + vente.total, 0);
      
      setStats({
        deposants: deposantsList.length,
        articles: articlesList.length,
        vendu: ventesList.length,
        chiffre: chiffre
      });
    } catch (error) {
      console.error('Erreur lors du chargement des stats:', error);
    }
  };

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color, 
    suffix = '' 
  }: {
    title: string;
    value: number;
    icon: any;
    color: string;
    suffix?: string;
  }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statHeader}>
        <Icon size={24} color={color} />
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <Text style={[styles.statValue, { color }]}>
        {value.toLocaleString()}{suffix}
      </Text>
    </View>
  );

  const ActionButton = ({ 
    title, 
    subtitle, 
    icon: Icon, 
    onPress, 
    color 
  }: {
    title: string;
    subtitle: string;
    icon: any;
    onPress: () => void;
    color: string;
  }) => (
    <TouchableOpacity 
      style={[styles.actionButton, { backgroundColor: color + '10' }]} 
      onPress={onPress}
    >
      <Icon size={32} color={color} />
      <View style={styles.actionText}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionSubtitle}>{subtitle}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>TagIt</Text>
          <Text style={styles.subtitle}>Gestion de bourse aux vêtements</Text>
        </View>

        <View style={styles.statsContainer}>
          <StatCard
            title="Déposants"
            value={stats.deposants}
            icon={Users}
            color="#3B82F6"
          />
          <StatCard
            title="Articles"
            value={stats.articles}
            icon={Package}
            color="#10B981"
          />
          <StatCard
            title="Vendus"
            value={stats.vendu}
            icon={TrendingUp}
            color="#F59E0B"
          />
          <StatCard
            title="Chiffre"
            value={stats.chiffre}
            icon={FileText}
            color="#8B5CF6"
            suffix="€"
          />
        </View>

        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>
          
          <ActionButton
            title="Nouveau déposant"
            subtitle="Créer un compte client"
            icon={Users}
            color="#3B82F6"
            onPress={() => {/* Navigation vers ajout déposant */}}
          />
          
          <ActionButton
            title="Ajouter article"
            subtitle="Photographier et étiqueter"
            icon={Package}
            color="#10B981"
            onPress={() => {/* Navigation vers ajout article */}}
          />
          
          <ActionButton
            title="Scanner QR"
            subtitle="Check-in ou vente"
            icon={AlertCircle}
            color="#F59E0B"
            onPress={() => {/* Navigation vers scanner */}}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 24,
    alignItems: 'center',
    marginTop: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  statsContainer: {
    padding: 16,
    gap: 12,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statTitle: {
    fontSize: 16,
    color: '#6B7280',
    marginLeft: 8,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  actionsContainer: {
    padding: 16,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  actionText: {
    marginLeft: 16,
    flex: 1,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
});