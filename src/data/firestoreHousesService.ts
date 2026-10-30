import { collection, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, testFirestoreConnection } from '../firebase';
import { HouseData } from '../types';
import { generateDefaultHouses, loadHousesData, saveHousesData } from './housesData';

export function subscribeToHouses(
  onUpdate: (houses: Record<string, HouseData>) => void
): () => void {
  // Test connection once
  testFirestoreConnection();

  const housesCollection = collection(db, 'houses');

  // Start real-time Firestore listener
  const unsubscribe = onSnapshot(
    housesCollection,
    (snapshot) => {
      if (snapshot.empty) {
        // If Firestore collection has not been written to yet, load defaults
        const current = loadHousesData();
        onUpdate(current);
        return;
      }

      // Merge defaults with live Firestore snapshot
      const merged: Record<string, HouseData> = generateDefaultHouses();

      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Partial<HouseData>;
        if (data.id && merged[data.id]) {
          merged[data.id] = {
            ...merged[data.id],
            ...data,
          } as HouseData;
        } else if (data.id) {
          merged[data.id] = data as HouseData;
        }
      });

      // Save to local cache as well
      saveHousesData(merged);
      onUpdate(merged);
    },
    (error) => {
      console.warn('Firestore subscription warning, falling back to local storage:', error.message);
      onUpdate(loadHousesData());
    }
  );

  return unsubscribe;
}

/**
 * Saves or updates a house in Firestore in real time.
 * Every device connected will receive the update automatically via onSnapshot.
 */
export async function saveHouseToFirestore(house: HouseData): Promise<void> {
  // 1. Immediately cache locally
  const current = loadHousesData();
  current[house.id] = house;
  saveHousesData(current);

  // 2. Persist to Firestore cloud database
  try {
    const houseDocRef = doc(db, 'houses', house.id);
    await setDoc(
      houseDocRef,
      {
        id: house.id,
        blockId: house.blockId || '',
        streetName: house.streetName || '',
        houseNumber: house.houseNumber || '',
        hasCandy: Boolean(house.hasCandy),
        candyNotes: house.candyNotes || '',
        mapX: house.mapX,
        mapY: house.mapY,
        rotationY: house.rotationY || 0,
        updatedAt: Date.now(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Error saving house to Firestore:', error);
  }
}
