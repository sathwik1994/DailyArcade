import React, { useState, useEffect, useRef, JSX } from 'react';
import {
View,
Text,
TouchableOpacity,
StyleSheet,
Dimensions,
SafeAreaView,
Alert,
Animated,
ScrollView,
StatusBar
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ScreenOrientation from 'expo-screen-orientation';

const { width, height } = Dimensions.get('window');
const screenWidth = Math.max(width, height);
const screenHeight = Math.min(width, height);

// Type definitions
type Suit = '♠' | '♥' | '♦' | '♣' | '🃏';
type CardValue = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'JOKER';
type GameState = 'menu' | 'playing' | 'gameOver';
type Player = 'player' | 'computer';
type GroupType = 'sequence' | 'set' | 'ungrouped';

interface Card {
suit: Suit;
value: CardValue;
id: string;
}

interface CardGroup {
id: string;
cards: Card[];
type: GroupType;
isValid: boolean;
}

interface CardProps {
card: Card;
onPress?: (card: Card) => void;
selected?: boolean;
style?: any;
isHidden?: boolean;
inGroup?: boolean;
groupColor?: string;
size?: 'small' | 'medium' | 'large';
}

// Constants
const SUITS: Suit[] = ['♠', '♥', '♦', '♣'];
const VALUES: Exclude<CardValue, 'JOKER'>[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const GROUP_COLORS = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7', '#a0e7e5', '#feca57'];

// Create a deck of cards
const createDeck = (): Card[] => {
const deck: Card[] = [];
for (let suit of SUITS) {
  for (let value of VALUES) {
    deck.push({ suit, value, id: `${suit}${value}` });
  }
}
deck.push({ suit: '🃏', value: 'JOKER', id: 'JOKER1' });
deck.push({ suit: '🃏', value: 'JOKER', id: 'JOKER2' });
return deck;
};

// Shuffle deck
const shuffleDeck = (deck: Card[]): Card[] => {
const shuffled = [...deck];
for (let i = shuffled.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
}
return shuffled;
};

// Game logic functions
const getCardNumericValue = (card: Card): number => {
if (card.value === 'A') return 1;
if (card.value === 'J') return 11;
if (card.value === 'Q') return 12;
if (card.value === 'K') return 13;
if (card.value === 'JOKER') return 0;
return parseInt(card.value as string);
};

const isValidSequence = (cards: Card[]): boolean => {
if (cards.length < 3) return false;

const sameSuit = cards.every(card => card.suit === cards[0].suit && card.value !== 'JOKER');
if (!sameSuit) return false;

const values = cards
  .filter(card => card.value !== 'JOKER')
  .map(getCardNumericValue)
  .sort((a, b) => a - b);

for (let i = 1; i < values.length; i++) {
  if (values[i] - values[i - 1] !== 1) return false;
}

return true;
};

const isValidSet = (cards: Card[]): boolean => {
if (cards.length < 3) return false;

const nonJokerCards = cards.filter(card => card.value !== 'JOKER');
if (nonJokerCards.length === 0) return false;

const value = nonJokerCards[0].value;
return nonJokerCards.every(card => card.value === value);
};

// Auto-arrange cards by suit, preserving custom groups
const autoArrangeCards = (cards: Card[], existingGroups: CardGroup[] = []): CardGroup[] => {
  console.log("Auto-arranging cards:", cards.length, "with existing groups:", existingGroups.length);
  
  // Keep existing custom groups that still have valid cards
  const customGroups = existingGroups.filter(group => 
    group.id.includes('custom-group') && 
    group.cards.every(card => cards.some(c => c.id === card.id))
  );
  
  // Get cards that are not in custom groups
  const customGroupCardIds = customGroups.flatMap(g => g.cards.map(c => c.id));
  const availableCards = cards.filter(card => !customGroupCardIds.includes(card.id));
  
  const groups: CardGroup[] = [...customGroups];
  let groupIndex = existingGroups.length;

  // Group remaining cards by suit
  for (let suit of SUITS) {
    const suitCards = availableCards.filter(card => card.suit === suit);
    if (suitCards.length > 0) {
      suitCards.sort((a, b) => getCardNumericValue(a) - getCardNumericValue(b));
      
      groups.push({
        id: `group-${groupIndex++}`,
        cards: suitCards,
        type: 'sequence',
        isValid: isValidSequence(suitCards)
      });
      console.log(`Added ${suit} group with ${suitCards.length} cards`);
    }
  }

  // Group jokers separately
  const jokerCards = availableCards.filter(card => card.suit === '🃏');
  if (jokerCards.length > 0) {
    groups.push({
      id: `group-${groupIndex++}`,
      cards: jokerCards,
      type: 'ungrouped',
      isValid: false
    });
    console.log(`Added joker group with ${jokerCards.length} cards`);
  }

  console.log("Final groups:", groups.length);
  return groups;
};

// Professional Card Component
const GameCard: React.FC<CardProps> = ({ 
card, 
onPress, 
selected = false, 
style, 
isHidden = false, 
inGroup = false, 
groupColor,
size = 'medium'
}) => {
const scaleAnim = useRef(new Animated.Value(1)).current;

const handlePress = (): void => {
  Animated.sequence([
    Animated.timing(scaleAnim, {
      toValue: 0.95,
      duration: 100,
      useNativeDriver: true,
    }),
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }),
  ]).start();
  
  if (onPress) onPress(card);
};

const isRed = card?.suit === '♥' || card?.suit === '♦';
const isJoker = card?.value === 'JOKER';

return (
  <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
    <TouchableOpacity
      style={[
        styles.card,
        size === 'small' && styles.cardSmall,
        size === 'large' && styles.cardLarge,
        selected && styles.selectedCard,
        isHidden && styles.hiddenCard,
        inGroup && { borderColor: groupColor, borderWidth: 2 }
      ]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      {!isHidden ? (
        <View style={styles.cardContent}>
          <Text style={[
            styles.cardValueTop,
            isRed ? styles.redCard : styles.blackCard,
            isJoker && styles.jokerCard
          ]}>
            {isJoker ? 'J' : card.value}
          </Text>
          <Text style={[
            styles.cardSuit,
            isRed ? styles.redCard : styles.blackCard,
            isJoker && styles.jokerCard
          ]}>
            {isJoker ? '🃏' : card.suit}
          </Text>
          <Text style={[
            styles.cardValueBottom,
            isRed ? styles.redCard : styles.blackCard,
            isJoker && styles.jokerCard
          ]}>
            {isJoker ? 'J' : card.value}
          </Text>
        </View>
      ) : (
        <View style={styles.cardBack}>
          <Text style={styles.cardBackText}>🂠</Text>
        </View>
      )}
    </TouchableOpacity>
  </Animated.View>
);
};

// Main App Component
const RummyApp: React.FC = () => {
const navigation = useNavigation();
const [gameState, setGameState] = useState<GameState>('menu');
const [deck, setDeck] = useState<Card[]>([]);
const [playerHand, setPlayerHand] = useState<Card[]>([]);
const [playerGroups, setPlayerGroups] = useState<CardGroup[]>([]);
const [computerHand, setComputerHand] = useState<Card[]>([]);
const [discardPile, setDiscardPile] = useState<Card[]>([]);
const [selectedCards, setSelectedCards] = useState<Card[]>([]);
const [currentPlayer, setCurrentPlayer] = useState<Player>('player');
const [playerScore, setPlayerScore] = useState<number>(0);
const [computerScore, setComputerScore] = useState<number>(0);
const [gameMessage, setGameMessage] = useState<string>('');
const [isMultiSelectMode, setIsMultiSelectMode] = useState<boolean>(false);
const [hasDrawnCard, setHasDrawnCard] = useState<boolean>(false);
const [newlyDrawnCard, setNewlyDrawnCard] = useState<Card | null>(null);

// Lock to landscape orientation
useEffect(() => {
  const lockOrientation = async () => {
    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
  };
  lockOrientation();
  
  return () => {
    ScreenOrientation.unlockAsync();
  };
}, []);

// Auto-arrange cards whenever player hand changes
useEffect(() => {
  console.log("Player hand changed:", playerHand.length, "cards");
  if (playerHand.length > 0) {
    const groups = autoArrangeCards(playerHand, playerGroups);
    console.log("Created groups:", groups.length, groups.map(g => `${g.type}: ${g.cards.length} cards`));
    setPlayerGroups(groups);
  } else {
    setPlayerGroups([]);
  }
}, [playerHand]);

// Back button handler with confirmation if game is in progress
const handleBackPress = () => {
  if (gameState === 'playing' && (playerHand.length > 0 || computerHand.length > 0)) {
    Alert.alert(
      'Exit Game?',
      'You have a game in progress. Are you sure you want to exit?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Exit', 
          style: 'destructive',
          onPress: () => {
            // Reset game state and navigate back
            setGameState('menu');
            navigation.goBack();
          }
        }
      ]
    );
  } else {
    navigation.goBack();
  }
};

// Initialize game
const initializeGame = (): void => {
  console.log("Initializing new game...");
  const newDeck = shuffleDeck(createDeck());
  const playerCards = newDeck.slice(0, 13);
  const computerCards = newDeck.slice(13, 26);
  const remainingDeck = newDeck.slice(26);
  
  console.log("Player cards:", playerCards.length);
  console.log("Computer cards:", computerCards.length);
  console.log("Remaining deck:", remainingDeck.length);
  
  setPlayerHand(playerCards);
  setComputerHand(computerCards);
  setDeck(remainingDeck.slice(1));
  setDiscardPile([remainingDeck[0]]);
  setCurrentPlayer('player');
  setSelectedCards([]);
  setIsMultiSelectMode(false);
  setHasDrawnCard(false);
  setNewlyDrawnCard(null);
  setGameState('playing');
  setGameMessage("Your turn! Draw a card from deck or discard pile");
};

// Reshuffle discard pile into deck when deck is empty
const reshuffleDiscardPile = (): boolean => {
  if (discardPile.length <= 1) {
    // If discard pile is also empty or has only 1 card, can't reshuffle
    Alert.alert("Game Over", "Both deck and discard pile are empty!");
    return false;
  }
  
  // Keep the top card in discard pile, shuffle the rest into deck
  const topCard = discardPile[discardPile.length - 1];
  const cardsToShuffle = discardPile.slice(0, -1);
  const newDeck = shuffleDeck(cardsToShuffle);
  
  setDeck(newDeck);
  setDiscardPile([topCard]);
  
  console.log(`Reshuffled ${cardsToShuffle.length} cards from discard pile into deck`);
  setGameMessage(`Deck reshuffled! ${newDeck.length} cards available`);
  
  return true;
};
  
// Draw card from deck
const drawFromDeck = (): void => {
  console.log("🎯 DECK DRAW FUNCTION CALLED");
  console.log("Current player:", currentPlayer);
  console.log("Has drawn card:", hasDrawnCard);
  console.log("Deck length:", deck.length);
  
  if (currentPlayer !== 'player') {
    console.log("❌ Not player's turn");
    Alert.alert("Not Your Turn", "Wait for your turn!");
    return;
  }
  
  if (hasDrawnCard) {
    console.log("❌ Already drew this turn");
    Alert.alert("Already Drew", "You already drew a card this turn. Please discard a card.");
    return;
  }
  
  // Check if deck is empty and needs reshuffling
  if (deck.length === 0) {
    console.log("⚠️ Deck is empty, attempting to reshuffle discard pile");
    const reshuffled = reshuffleDiscardPile();
    if (!reshuffled) {
      return; // Game should end if can't reshuffle
    }
  }
  
  // Check again after potential reshuffle
  if (deck.length === 0) {
    console.log("❌ Deck still empty after reshuffle attempt");
    Alert.alert("No Cards", "No cards available to draw!");
    return;
  }
  
  console.log("✅ Drawing card from deck...");
  const newCard = deck[0];
  const newDeck = deck.slice(1);
  
  setPlayerHand(prev => {
    console.log("Previous hand size:", prev.length);
    console.log("New hand size will be:", prev.length + 1);
    return [...prev, newCard];
  });
  setDeck(newDeck);
  setSelectedCards([]);
  setHasDrawnCard(true);
  setNewlyDrawnCard(newCard);
  setGameMessage(`Drew ${newCard.value}${newCard.suit} - Select a card to discard`);
  
  // Clear the highlight after 3 seconds
  setTimeout(() => {
    setNewlyDrawnCard(null);
  }, 3000);
  
  console.log("✅ Successfully drew:", newCard.value + newCard.suit);
  console.log("✅ New deck size:", newDeck.length);
};

// Draw card from discard pile
const drawFromDiscardPile = (): void => {
  console.log("🎯 DISCARD DRAW FUNCTION CALLED");
  console.log("Current player:", currentPlayer);
  console.log("Has drawn card:", hasDrawnCard);
  console.log("Discard length:", discardPile.length);
  
  if (currentPlayer !== 'player') {
    console.log("❌ Not player's turn");
    Alert.alert("Not Your Turn", "Wait for your turn!");
    return;
  }
  
  if (hasDrawnCard) {
    console.log("❌ Already drew this turn");
    Alert.alert("Already Drew", "You already drew a card this turn. Please discard a card.");
    return;
  }
  
  if (discardPile.length === 0) {
    console.log("❌ Discard pile is empty");
    Alert.alert("No Cards", "The discard pile is empty!");
    return;
  }
  
  console.log("✅ Drawing card from discard pile...");
  const topCard = discardPile[discardPile.length - 1];
  const newDiscardPile = discardPile.slice(0, -1);
  
  setPlayerHand(prev => [...prev, topCard]);
  setDiscardPile(newDiscardPile);
  setSelectedCards([]);
  setHasDrawnCard(true);
  setNewlyDrawnCard(topCard);
  setGameMessage(`Drew ${topCard.value}${topCard.suit} - Select a card to discard`);
  
  // Clear the highlight after 3 seconds
  setTimeout(() => {
    setNewlyDrawnCard(null);
  }, 3000);
  
  console.log("✅ Successfully drew from discard:", topCard.value + topCard.suit);
};

// Handle card selection
const handleCardSelection = (card: Card): void => {
  if (isMultiSelectMode) {
    setSelectedCards(prev => {
      const isSelected = prev.some(c => c.id === card.id);
      if (isSelected) {
        return prev.filter(c => c.id !== card.id);
      } else {
        return [...prev, card];
      }
    });
  } else {
    setSelectedCards([card]);
  }
};

// Discard selected card
const discardCard = (): void => {
  if (selectedCards.length !== 1) {
    Alert.alert("Select One Card", "Please select exactly one card to discard");
    return;
  }
  
  if (!hasDrawnCard) {
    Alert.alert("Draw First", "You need to draw a card before discarding");
    return;
  }
  
  const cardToDiscard = selectedCards[0];
  const newHand = playerHand.filter(card => card.id !== cardToDiscard.id);
  const newDiscardPile = [...discardPile, cardToDiscard];
  
  setPlayerHand(newHand);
  setDiscardPile(newDiscardPile);
  setSelectedCards([]);
  setHasDrawnCard(false);
  setNewlyDrawnCard(null); // Clear highlight when discarding
  
  // Check for win condition
  if (newHand.length === 0) {
    endGame('player');
    return;
  }
  
  // Pass turn to computer
  setCurrentPlayer('computer');
  setGameMessage("Computer's turn...");
  setTimeout(computerTurn, 1000);
  
  console.log("Player discarded:", cardToDiscard, "Hand size:", newHand.length);
};

// Create custom group from selected cards
const createCustomGroup = (): void => {
  if (selectedCards.length < 2) {
    Alert.alert("Invalid Group", "Select at least 2 cards to create a group");
    return;
  }

  // Remove selected cards from existing groups, but keep manually created groups intact
  const newGroups = playerGroups.map(group => {
    // If this is a manually created group (custom), keep it as is
    if (group.type === 'set' && group.id.includes('custom-group')) {
      // Only remove cards if they're being moved to a new group
      return {
        ...group,
        cards: group.cards.filter(card => !selectedCards.some(sc => sc.id === card.id))
      };
    }
    // For auto-generated groups (by suit), remove selected cards
    return {
      ...group,
      cards: group.cards.filter(card => !selectedCards.some(sc => sc.id === card.id))
    };
  }).filter(group => group.cards.length > 0);

  // Add new custom group
  const newGroup: CardGroup = {
    id: `custom-group-${Date.now()}`,
    cards: selectedCards,
    type: 'set',
    isValid: isValidSequence(selectedCards) || isValidSet(selectedCards)
  };

  newGroups.push(newGroup);
  
  // Re-arrange any remaining ungrouped cards by suit
  const groupedCardIds = newGroups.flatMap(g => g.cards.map(c => c.id));
  const ungroupedCards = playerHand.filter(card => !groupedCardIds.includes(card.id));
  
  // Group remaining cards by suit
  for (let suit of SUITS) {
    const suitCards = ungroupedCards.filter(card => card.suit === suit);
    if (suitCards.length > 0) {
      suitCards.sort((a, b) => getCardNumericValue(a) - getCardNumericValue(b));
      
      newGroups.push({
        id: `auto-group-${suit}-${Date.now()}`,
        cards: suitCards,
        type: 'sequence',
        isValid: isValidSequence(suitCards)
      });
    }
  }
  
  // Add jokers if any
  const jokerCards = ungroupedCards.filter(card => card.suit === '🃏');
  if (jokerCards.length > 0) {
    newGroups.push({
      id: `joker-group-${Date.now()}`,
      cards: jokerCards,
      type: 'ungrouped',
      isValid: false
    });
  }

  setPlayerGroups(newGroups);
  setSelectedCards([]);
  Alert.alert("Success!", `Created a custom group with ${selectedCards.length} cards!`);
};

// Computer AI turn
const computerTurn = (): void => {
  console.log("Computer turn starting. Hand size:", computerHand.length, "Deck:", deck.length);
  
  let newComputerHand: Card[] = [...computerHand];
  let newDeck = [...deck];
  let newDiscardPile = [...discardPile];
  
  // Computer draws a card
  const drawFromDeckAI = Math.random() > 0.3;
  
  if (drawFromDeckAI && newDeck.length > 0) {
    const drawnCard = newDeck[0];
    newComputerHand.push(drawnCard);
    newDeck = newDeck.slice(1);
    console.log("Computer drew from deck:", drawnCard);
  } else if (drawFromDeckAI && newDeck.length === 0) {
    // Computer needs to reshuffle deck
    console.log("Computer attempting to reshuffle deck");
    if (newDiscardPile.length > 1) {
      const topCard = newDiscardPile[newDiscardPile.length - 1];
      const cardsToShuffle = newDiscardPile.slice(0, -1);
      newDeck = shuffleDeck(cardsToShuffle);
      newDiscardPile = [topCard];
      
      // Now draw from reshuffled deck
      if (newDeck.length > 0) {
        const drawnCard = newDeck[0];
        newComputerHand.push(drawnCard);
        newDeck = newDeck.slice(1);
        console.log("Computer drew from reshuffled deck:", drawnCard);
      }
    } else {
      // Try to draw from discard pile instead
      if (newDiscardPile.length > 0) {
        const drawnCard = newDiscardPile[newDiscardPile.length - 1];
        newComputerHand.push(drawnCard);
        newDiscardPile = newDiscardPile.slice(0, -1);
        console.log("Computer drew from discard:", drawnCard);
      }
    }
  } else if (newDiscardPile.length > 0) {
    const drawnCard = newDiscardPile[newDiscardPile.length - 1];
    newComputerHand.push(drawnCard);
    newDiscardPile = newDiscardPile.slice(0, -1);
    console.log("Computer drew from discard:", drawnCard);
  }
  
  // Computer discards a card
  if (newComputerHand.length > 0) {
    const randomIndex = Math.floor(Math.random() * newComputerHand.length);
    const cardToDiscard = newComputerHand[randomIndex];
    newComputerHand = newComputerHand.filter((_, index) => index !== randomIndex);
    newDiscardPile.push(cardToDiscard);
    console.log("Computer discarded:", cardToDiscard);
  }
  
  // Update game state
  setComputerHand(newComputerHand);
  setDeck(newDeck);
  setDiscardPile(newDiscardPile);
  
  // Check win condition
  if (newComputerHand.length === 0) {
    endGame('computer');
    return;
  }
  
  // Pass turn back to player
  setCurrentPlayer('player');
  setGameMessage("Your turn! Draw a card from deck or discard pile");
  
  console.log("Computer turn complete. Hand size:", newComputerHand.length);
};

// End game
const endGame = (winner: Player): void => {
  setGameState('gameOver');
  if (winner === 'player') {
    setPlayerScore(prev => prev + 1);
    setGameMessage("Congratulations! You won!");
  } else {
    setComputerScore(prev => prev + 1);
    setGameMessage("Computer won! Better luck next time!");
  }
};

// Declare game
const declareGame = (): void => {
  const validGroups = playerGroups.filter(group => group.isValid);
  const totalValidCards = validGroups.reduce((sum, group) => sum + group.cards.length, 0);
  
  if (totalValidCards >= playerHand.length - 1) {
    endGame('player');
  } else {
    Alert.alert("Invalid Declaration", "You need more valid sequences and sets to declare!");
  }
};

const renderMenuScreen = (): JSX.Element => (
  <View style={styles.menuContainer}>
    <TouchableOpacity style={styles.backButtonMenu} onPress={handleBackPress}>
      <Text style={styles.backButtonText}>← Back to Arcade</Text>
    </TouchableOpacity>
    
    <Text style={styles.title}>Indian Rummy</Text>
    <Text style={styles.subtitle}>Play like a champion!</Text>
    
    <TouchableOpacity 
      style={styles.menuButton} 
      onPress={initializeGame}
    >
      <Text style={styles.menuButtonText}>Play vs Computer</Text>
    </TouchableOpacity>
    
    <TouchableOpacity 
      style={[styles.menuButton, styles.disabledButton]} 
      disabled
    >
      <Text style={[styles.menuButtonText, styles.disabledText]}>
        Play vs Friends (Coming Soon)
      </Text>
    </TouchableOpacity>
    
    <View style={styles.scoreContainer}>
      <Text style={styles.scoreText}>Your Wins: {playerScore}</Text>
      <Text style={styles.scoreText}>Computer Wins: {computerScore}</Text>
    </View>
  </View>
);

const renderGameScreen = (): JSX.Element => (
  <View style={styles.tableContainer}>
    <ScrollView style={styles.gameScrollView} showsVerticalScrollIndicator={false}>
      {/* Top Controls - Integrated into game area */}
      <View style={styles.topGameControls}>
        <TouchableOpacity style={styles.exitButtonGame} onPress={handleBackPress}>
          <Text style={styles.exitButtonText}>← Exit</Text>
        </TouchableOpacity>
        
        <View style={styles.gameInfoCenter}>
          <Text style={styles.gameInfoText}>Pool Rummy • Deck: {deck.length} cards</Text>
        </View>
        
        <TouchableOpacity 
          style={[styles.multiSelectButtonGame, isMultiSelectMode && styles.activeMultiSelect]}
          onPress={() => {
            setIsMultiSelectMode(!isMultiSelectMode);
            setSelectedCards([]);
          }}
        >
          <Text style={styles.multiSelectButtonText}>
            {isMultiSelectMode ? 'Exit Multi' : 'Multi-Select'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Computer Player Area */}
      <View style={styles.computerArea}>
        <View style={styles.playerInfoComputer}>
          <View style={[styles.playerAvatar, currentPlayer === 'computer' && styles.activePlayer]}>
            <Text style={styles.playerAvatarText}>C</Text>
          </View>
          <Text style={styles.playerName}>Computer ({computerHand.length} cards)</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.computerCardsScroll}>
          <View style={styles.computerCards}>
            {computerHand.map((card, index) => (
              <GameCard 
                key={card.id} 
                card={card} 
                isHidden={true}
                size="small"
                style={[styles.computerCard, { marginLeft: index > 0 ? -10 : 0 }]}
              />
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Center Game Area */}
      <View style={styles.centerArea}>
        {/* Deck */}
        <View style={styles.deckSection}>
          <TouchableOpacity 
            style={styles.deckTouchArea}
            onPress={() => {
              console.log("DECK TOUCHED!");
              drawFromDeck();
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.deckContainer, 
              (currentPlayer !== 'player' || hasDrawnCard || deck.length === 0) && styles.disabledContainer
            ]}>
              <GameCard 
                card={{ suit: '♠', value: 'A', id: 'deck' }}
                isHidden={true}
              />
              <Text style={styles.deckLabel}>
                Deck ({deck.length})
              </Text>
              <Text style={styles.deckStatus}>
                {currentPlayer !== 'player' ? 'Not your turn' : 
                 hasDrawnCard ? 'Already drew' : 
                 deck.length === 0 && discardPile.length <= 1 ? 'No cards' :
                 deck.length === 0 ? 'Will reshuffle' :
                 'TAP TO DRAW'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Center Actions */}
        <View style={styles.centerInfo}>
          <Text style={styles.gameMessage}>{gameMessage}</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.actionButton, (!hasDrawnCard || selectedCards.length !== 1) && styles.disabledButton]}
              onPress={() => {
                console.log("DISCARD BUTTON TOUCHED!");
                discardCard();
              }}
              disabled={!hasDrawnCard || selectedCards.length !== 1 || currentPlayer !== 'player'}
            >
              <Text style={styles.actionButtonText}>Discard</Text>
            </TouchableOpacity>

            {isMultiSelectMode && (
              <TouchableOpacity 
                style={[styles.actionButton, selectedCards.length < 2 && styles.disabledButton]}
                onPress={createCustomGroup}
                disabled={selectedCards.length < 2}
              >
                <Text style={styles.actionButtonText}>Group</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={styles.declareButton}
              onPress={declareGame}
              disabled={currentPlayer !== 'player'}
            >
              <Text style={styles.declareButtonText}>Declare</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Discard */}
        <View style={styles.discardSection}>
          <TouchableOpacity 
            style={styles.discardTouchArea}
            onPress={() => {
              console.log("DISCARD PILE TOUCHED!");
              drawFromDiscardPile();
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.discardContainer,
              (currentPlayer !== 'player' || hasDrawnCard || discardPile.length === 0) && styles.disabledContainer
            ]}>
              {discardPile.length > 0 && (
                <GameCard 
                  card={discardPile[discardPile.length - 1]}
                />
              )}
              <Text style={styles.discardLabel}>
                Discard ({discardPile.length})
              </Text>
              <Text style={styles.discardStatus}>
                {currentPlayer !== 'player' ? 'Not your turn' : 
                 hasDrawnCard ? 'Already drew' : 
                 discardPile.length === 0 ? 'Empty' : 'TAP TO DRAW'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Player Hand Area - Groups Only */}
      <View style={styles.playerArea}>
        {/* Multi-Select Status */}
        {isMultiSelectMode && (
          <View style={styles.multiSelectStatus}>
            <Text style={styles.multiSelectText}>
              Multi-Select Mode: {selectedCards.length} cards selected
            </Text>
            {selectedCards.length > 0 && (
              <View style={styles.selectedCardsPreview}>
                {selectedCards.map((card, index) => (
                  <Text key={card.id} style={styles.selectedCardText}>
                    {index + 1}. {card.value}{card.suit}
                  </Text>
                ))}
              </View>
            )}
          </View>
        )}
        
        {/* Card Groups in Row Layout */}
        {playerGroups.length > 0 ? (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={true} 
            style={styles.groupsRowScroll}
            contentContainerStyle={styles.groupsRowContainer}
          >
            {playerGroups.map((group, groupIndex) => (
              <View key={group.id} style={styles.cardGroupRow}>
                <Text style={[styles.groupLabelRow, { color: GROUP_COLORS[groupIndex % GROUP_COLORS.length] }]}>
                  {group.type === 'ungrouped' ? 'Jokers 🃏' : 
                   group.id.includes('custom-group') ? 'Custom Group' :
                   group.cards[0]?.suit === '♠' ? 'Spades ♠' :
                   group.cards[0]?.suit === '♥' ? 'Hearts ♥' :
                   group.cards[0]?.suit === '♦' ? 'Diamonds ♦' :
                   group.cards[0]?.suit === '♣' ? 'Clubs ♣' :
                   'Unknown Group'} ({group.cards.length})
                  {group.isValid && <Text style={styles.validIndicator}> ✓</Text>}
                </Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.groupCardsScrollHorizontal}
                  contentContainerStyle={styles.groupCardsRowContainer}
                >
                  {group.cards.map((card, cardIndex) => {
                    const isNewlyDrawn = newlyDrawnCard && newlyDrawnCard.id === card.id;
                    const isSelected = selectedCards.some(c => c.id === card.id);
                    const selectedIndex = selectedCards.findIndex(c => c.id === card.id);
                    
                    return (
                      <View key={card.id} style={styles.cardWrapper}>
                        <GameCard 
                          card={card}
                          selected={isSelected}
                          onPress={handleCardSelection}
                          inGroup={group.type !== 'ungrouped'}
                          groupColor={GROUP_COLORS[groupIndex % GROUP_COLORS.length]}
                          size="medium"
                          style={[
                            styles.groupCardInLine, 
                            { marginLeft: cardIndex > 0 ? -15 : 0 },
                            isNewlyDrawn && styles.newlyDrawnCard,
                            isSelected && isMultiSelectMode && styles.multiSelectedCard,
                            isSelected && !isMultiSelectMode && styles.discardSelectedCard
                          ]}
                        />
                        {/* Multi-select indicator */}
                        {isSelected && isMultiSelectMode && (
                          <View style={styles.selectionIndicator}>
                            <Text style={styles.selectionNumber}>{selectedIndex + 1}</Text>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </ScrollView>
              </View>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.noGroupsContainer}>
            <Text style={styles.noCardsText}>
              {playerHand.length === 0 ? "No cards in hand" : "Loading card groups..."}
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  </View>
);

const renderGameOverScreen = (): JSX.Element => (
  <View style={styles.menuContainer}>
    <Text style={styles.title}>Game Over</Text>
    <Text style={styles.gameOverMessage}>{gameMessage}</Text>
    
    <View style={styles.scoreContainer}>
      <Text style={styles.scoreText}>Your Wins: {playerScore}</Text>
      <Text style={styles.scoreText}>Computer Wins: {computerScore}</Text>
    </View>
    
    <TouchableOpacity 
      style={styles.menuButton} 
      onPress={initializeGame}
    >
      <Text style={styles.menuButtonText}>Play Again</Text>
    </TouchableOpacity>
    
    <TouchableOpacity 
      style={[styles.menuButton, styles.secondaryButton]} 
      onPress={() => setGameState('menu')}
    >
      <Text style={styles.menuButtonText}>Main Menu</Text>
    </TouchableOpacity>
  </View>
);

return (
  <SafeAreaView style={styles.container}>
    <StatusBar barStyle="light-content" backgroundColor="#1a5f3f" />
    {gameState === 'menu' && renderMenuScreen()}
    {gameState === 'playing' && renderGameScreen()}
    {gameState === 'gameOver' && renderGameOverScreen()}
  </SafeAreaView>
);
};

const styles = StyleSheet.create({
container: {
  flex: 1,
  backgroundColor: '#0f4c2c',
},

// Menu Styles
menuContainer: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  padding: 20,
  backgroundColor: '#0f4c2c',
},
backButtonMenu: {
  position: 'absolute',
  top: 60,
  left: 20,
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  paddingHorizontal: 16,
  paddingVertical: 8,
  borderRadius: 20,
  borderWidth: 1,
  borderColor: '#DAA520',
},
backButtonText: {
  color: '#fff',
  fontSize: 16,
  fontWeight: '600',
},
title: {
  fontSize: 42,
  fontWeight: 'bold',
  color: '#fff',
  marginBottom: 10,
  textAlign: 'center',
},
subtitle: {
  fontSize: 20,
  color: '#b8d4c8',
  marginBottom: 40,
  textAlign: 'center',
},
menuButton: {
  backgroundColor: '#8B4513',
  paddingHorizontal: 40,
  paddingVertical: 18,
  borderRadius: 25,
  marginVertical: 12,
  minWidth: 250,
  elevation: 5,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 4,
},
secondaryButton: {
  backgroundColor: '#5a5a5a',
},
disabledButton: {
  backgroundColor: '#404040',
},
menuButtonText: {
  color: '#fff',
  fontSize: 20,
  fontWeight: 'bold',
  textAlign: 'center',
},
disabledText: {
  color: '#888',
},
scoreContainer: {
  marginVertical: 25,
  alignItems: 'center',
},
scoreText: {
  color: '#fff',
  fontSize: 20,
  marginVertical: 6,
},
gameOverMessage: {
  color: '#fff',
  fontSize: 22,
  textAlign: 'center',
  marginVertical: 25,
  fontWeight: 'bold',
},

// Table Layout
tableContainer: {
  flex: 1,
  backgroundColor: '#1a5f3f',
},
gameScrollView: {
  flex: 1,
},

// Top game controls integrated into green area
topGameControls: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingHorizontal: 20,
  paddingVertical: 15,
  backgroundColor: 'rgba(0,0,0,0.1)',
  marginBottom: 10,
},
exitButtonGame: {
  backgroundColor: 'rgba(0,0,0,0.3)',
  paddingHorizontal: 15,
  paddingVertical: 8,
  borderRadius: 15,
  borderWidth: 1,
  borderColor: '#DAA520',
},
exitButtonText: {
  color: '#fff',
  fontSize: 14,
  fontWeight: 'bold',
},
gameInfoCenter: {
  flex: 1,
  alignItems: 'center',
},
gameInfoText: {
  color: '#fff',
  fontSize: 16,
  fontWeight: 'bold',
},
multiSelectButtonGame: {
  backgroundColor: 'rgba(0,0,0,0.3)',
  paddingHorizontal: 15,
  paddingVertical: 8,
  borderRadius: 15,
  borderWidth: 1,
  borderColor: '#DAA520',
},
activeMultiSelect: {
  backgroundColor: '#DAA520',
  borderColor: '#FFD700',
},
multiSelectButtonText: {
  color: '#fff',
  fontSize: 12,
  fontWeight: 'bold',
},

// Computer Area
computerArea: {
  paddingHorizontal: 20,
  paddingVertical: 15,
  alignItems: 'center',
  backgroundColor: 'rgba(0,0,0,0.1)',
},
playerInfoComputer: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: 15,
},
computerCardsScroll: {
  marginTop: 10,
},
computerCards: {
  flexDirection: 'row',
  alignItems: 'center',
},
computerCard: {
  marginHorizontal: 1,
},

// Center Area
centerArea: {
  flexDirection: 'row',
  justifyContent: 'space-around',
  alignItems: 'center',
  paddingVertical: 20,
  paddingHorizontal: 20,
  backgroundColor: 'rgba(255,255,255,0.05)',
  marginVertical: 10,
},

// Deck section
deckSection: {
  alignItems: 'center',
},
deckTouchArea: {
  padding: 10,
  borderRadius: 15,
  backgroundColor: 'rgba(255,255,255,0.1)',
  borderWidth: 2,
  borderColor: '#DAA520',
},
deckContainer: {
  alignItems: 'center',
},
deckLabel: {
  color: '#fff',
  fontSize: 12,
  fontWeight: 'bold',
  marginTop: 5,
  textAlign: 'center',
},
deckStatus: {
  color: '#FFD700',
  fontSize: 10,
  fontWeight: 'bold',
  marginTop: 2,
  textAlign: 'center',
},

// Discard section
discardSection: {
  alignItems: 'center',
},
discardTouchArea: {
  padding: 10,
  borderRadius: 15,
  backgroundColor: 'rgba(255,255,255,0.1)',
  borderWidth: 2,
  borderColor: '#DAA520',
},
discardContainer: {
  alignItems: 'center',
},
discardLabel: {
  color: '#fff',
  fontSize: 12,
  fontWeight: 'bold',
  marginTop: 5,
  textAlign: 'center',
},
discardStatus: {
  color: '#FFD700',
  fontSize: 10,
  fontWeight: 'bold',
  marginTop: 2,
  textAlign: 'center',
},
disabledContainer: {
  opacity: 0.5,
},

centerInfo: {
  alignItems: 'center',
  flex: 1,
  paddingHorizontal: 20,
},
gameMessage: {
  color: '#fff',
  fontSize: 16,
  textAlign: 'center',
  marginBottom: 15,
  fontWeight: '500',
},
actionButtons: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  justifyContent: 'center',
},
actionButton: {
  backgroundColor: '#8B4513',
  paddingHorizontal: 15,
  paddingVertical: 10,
  borderRadius: 18,
  marginHorizontal: 5,
  marginVertical: 5,
},
actionButtonText: {
  color: '#fff',
  fontSize: 14,
  fontWeight: 'bold',
},
declareButton: {
  backgroundColor: '#DAA520',
  paddingHorizontal: 15,
  paddingVertical: 10,
  borderRadius: 18,
  marginHorizontal: 5,
  marginVertical: 5,
},
declareButtonText: {
  color: '#000',
  fontSize: 14,
  fontWeight: 'bold',
},

// Player Area - Simplified without player info
playerArea: {
  paddingHorizontal: 20,
  paddingVertical: 15,
  backgroundColor: 'rgba(0,0,0,0.1)',
  minHeight: 200,
},
playerAvatar: {
  width: 40,
  height: 40,
  borderRadius: 20,
  backgroundColor: '#666',
  justifyContent: 'center',
  alignItems: 'center',
  marginRight: 10,
},
activePlayer: {
  backgroundColor: '#DAA520',
  borderWidth: 2,
  borderColor: '#FFD700',
},
playerAvatarText: {
  color: '#fff',
  fontSize: 16,
  fontWeight: 'bold',
},
playerName: {
  color: '#fff',
  fontSize: 16,
  fontWeight: 'bold',
},

// Multi-Select Status Area
multiSelectStatus: {
  backgroundColor: 'rgba(218, 165, 32, 0.2)',
  borderRadius: 10,
  padding: 12,
  marginBottom: 15,
  borderWidth: 1,
  borderColor: '#DAA520',
},
multiSelectText: {
  color: '#FFD700',
  fontSize: 14,
  fontWeight: 'bold',
  textAlign: 'center',
  marginBottom: 8,
},
selectedCardsPreview: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  justifyContent: 'center',
},
selectedCardText: {
  color: '#fff',
  fontSize: 12,
  backgroundColor: 'rgba(255,255,255,0.2)',
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 8,
  marginHorizontal: 3,
  marginVertical: 2,
},

// Card Wrapper for Multi-Select
cardWrapper: {
  position: 'relative',
},
selectionIndicator: {
  position: 'absolute',
  top: -8,
  right: -8,
  backgroundColor: '#FF6B6B',
  borderRadius: 12,
  width: 24,
  height: 24,
  justifyContent: 'center',
  alignItems: 'center',
  borderWidth: 2,
  borderColor: '#fff',
  elevation: 5,
},
selectionNumber: {
  color: '#fff',
  fontSize: 12,
  fontWeight: 'bold',
},

// Groups in Row Layout with Cards in Lines
groupsRowScroll: {
  flex: 1,
},
groupsRowContainer: {
  flexDirection: 'row',
  alignItems: 'flex-start',
  paddingVertical: 10,
  paddingHorizontal: 5,
},
cardGroupRow: {
  alignItems: 'center',
  marginHorizontal: 8,
  backgroundColor: 'rgba(255,255,255,0.1)',
  borderRadius: 12,
  padding: 12,
  minWidth: 150,
  maxWidth: 250,
},
groupLabelRow: {
  fontSize: 14,
  fontWeight: 'bold',
  marginBottom: 12,
  textAlign: 'center',
  minHeight: 35,
},
groupCardsScrollHorizontal: {
  maxHeight: 80,
},
groupCardsRowContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingVertical: 5,
},
groupCardInLine: {
  marginVertical: 0,
},

// No groups container
noGroupsContainer: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: 150,
},
noCardsText: {
  color: '#fff',
  fontSize: 16,
  textAlign: 'center',
  fontStyle: 'italic',
},

validIndicator: {
  color: '#4ecdc4',
},

// Card Styles
card: {
  backgroundColor: '#fff',
  borderRadius: 8,
  borderWidth: 1,
  borderColor: '#ddd',
  justifyContent: 'space-between',
  elevation: 3,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 4,
  width: 50,
  height: 70,
},
cardSmall: {
  width: 35,
  height: 50,
},
cardLarge: {
  width: 60,
  height: 85,
},
selectedCard: {
  borderColor: '#FFD700',
  borderWidth: 3,
  elevation: 8,
  shadowColor: '#FFD700',
},
newlyDrawnCard: {
  borderColor: '#00FF00',
  borderWidth: 4,
  elevation: 10,
  shadowColor: '#00FF00',
  shadowOpacity: 0.8,
  backgroundColor: '#f0fff0',
},
multiSelectedCard: {
  borderColor: '#FF6B6B',
  borderWidth: 3,
  elevation: 8,
  shadowColor: '#FF6B6B',
  shadowOpacity: 0.6,
  transform: [{ scale: 1.05 }],
},
discardSelectedCard: {
  borderColor: '#FFD700',
  borderWidth: 4,
  elevation: 10,
  shadowColor: '#FFD700',
  shadowOpacity: 0.8,
  backgroundColor: '#fffacd',
  transform: [{ scale: 1.1 }],
},
hiddenCard: {
  backgroundColor: '#8B0000',
},
cardContent: {
  flex: 1,
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingVertical: 4,
  paddingHorizontal: 2,
},
cardValueTop: {
  fontSize: 10,
  fontWeight: 'bold',
  alignSelf: 'flex-start',
  marginLeft: 2,
},
cardSuit: {
  fontSize: 16,
  fontWeight: 'bold',
},
cardValueBottom: {
  fontSize: 10,
  fontWeight: 'bold',
  alignSelf: 'flex-end',
  marginRight: 2,
  transform: [{ rotate: '180deg' }],
},
redCard: {
  color: '#dc2626',
},
blackCard: {
  color: '#000',
},
jokerCard: {
  color: '#7c2d12',
},
cardBack: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '#8B0000',
},
cardBackText: {
  fontSize: 24,
  color: '#FFD700',
},
});

export default RummyApp;