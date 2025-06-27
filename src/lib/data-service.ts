
import { db, auth, authInitialized } from './firebase';
import { collection, getDocs, doc, getDoc, setDoc, query, where, addDoc, updateDoc, deleteDoc, Timestamp, arrayUnion, orderBy } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import type { Driver, Team, Competition, Challenge, RankHistory, VehicleHistoryEntry, FleetChangeLog } from './data-types';

// Helper function to convert Firestore doc to a usable object with ID
function docToObject<T>(doc: any): T {
    const data = doc.data();
    // Convert Timestamps to ISO strings
    for (const key in data) {
        if (data[key] instanceof Timestamp) {
            data[key] = data[key].toDate().toISOString();
        }
    }
    return { ...data, id: doc.id } as T;
}

// --- Auth Functions ---
export async function signUpUser(driverData: Partial<Omit<Driver, 'id'>>, password: string): Promise<void> {
    if (!driverData.email || !driverData.name) {
        throw new Error("Email and name are required for signup.");
    }
    const userCredential = await createUserWithEmailAndPassword(auth, driverData.email, password);
    const user = userCredential.user;

    const initialHistory: VehicleHistoryEntry = {
        licensePlate: driverData.licensePlate || 'N/A',
        vehicleModel: driverData.vehicleModel || 'N/A',
        assignedDate: new Date().toISOString(),
        unassignedDate: null,
    };

    const newDriver: Omit<Driver, 'id'> = {
        name: driverData.name,
        email: driverData.email,
        avatar: driverData.avatar || '/avatars/default.png',
        rank: 999,
        points: 0,
        moneyBalance: 0,
        trips: 0,
        safetyScore: 100,
        efficiency: 100,
        licensePlate: driverData.licensePlate || 'N/A',
        vehicleModel: driverData.vehicleModel || 'N/A',
        teamId: driverData.teamId || '',
        dailyDeliveries: [],
        notifications: [],
        achievementIds: [],
        licensePlateHistory: [initialHistory],
    };
    
    // Use the user's UID as the document ID in Firestore
    await setDoc(doc(db, 'drivers', user.uid), newDriver);
}

export async function signInUser(email: string, password: string): Promise<void> {
    await signInWithEmailAndPassword(auth, email, password);
}

export async function signOutUser(): Promise<void> {
    await signOut(auth);
}

// --- Driver Functions ---
export async function getAllDrivers(): Promise<Driver[]> {
    const q = query(collection(db, 'drivers'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => docToObject<Driver>(d));
}

export async function getDriver(id: string): Promise<Driver | null> {
    const driverDoc = await getDoc(doc(db, 'drivers', id));
    return driverDoc.exists() ? docToObject<Driver>(driverDoc) : null;
}

export async function getDriversByTeam(teamId: string): Promise<Driver[]> {
    const q = query(collection(db, 'drivers'), where('teamId', '==', teamId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => docToObject<Driver>(d));
}

export async function updateDriver(id: string, data: Partial<Driver>) {
    await updateDoc(doc(db, 'drivers', id), data);
}

// NOTE: This now creates a Firebase Auth user as well.
// This function will sign the admin out and the new user in. This is a limitation of the client-side SDK.
export async function addDriver(driverData: Omit<Driver, 'id'>, password: string) {
    // We can re-use the main signUpUser function
    await signUpUser(driverData, password);

    // After signUpUser creates the doc, log the event
    const user = auth.currentUser;
    if (user) {
        await addFleetChangeLog({
            driverId: user.uid,
            driverName: driverData.name,
            changeDescription: `Novo motorista/veículo adicionado: ${driverData.name} com ${driverData.vehicleModel} (${driverData.licensePlate}).`
        });
    }
}

export async function deleteDriver(id: string) {
    // This function doesn't actually delete the driver, but rather converts them
    // into a "Free Vehicle" by clearing personal data but keeping vehicle data.
    // The associated Firebase Auth user is not touched.
    const driverToDelete = await getDriver(id);
    if (!driverToDelete) return;
    
    if (driverToDelete.name === '[VEÍCULO LIVRE]') {
        // If it's already a free vehicle, delete it permanently.
        await addFleetChangeLog({
            driverId: id,
            driverName: '[VEÍCULO LIVRE]',
            changeDescription: `Veículo ${driverToDelete.licensePlate} removido permanentemente.`
        });
        await deleteDoc(doc(db, 'drivers', id));
    } else {
        // If it's an active driver, convert them to a free vehicle.
        const updates = {
            name: '[VEÍCULO LIVRE]',
            email: `deleted-${id}@fastrack.lu`, // Placeholder to avoid conflicts
            teamId: '',
            avatar: '/avatars/default.png',
            rank: 999,
            points: 0,
            moneyBalance: 0,
            trips: 0,
            safetyScore: 100,
            efficiency: 100,
            dailyDeliveries: [],
            notifications: [],
            achievementIds: [],
        };
        
        await updateDoc(doc(db, 'drivers', id), updates);

        await addFleetChangeLog({
            driverId: id,
            driverName: driverToDelete.name,
            changeDescription: `Motorista "${driverToDelete.name}" removido. Veículo ${driverToDelete.licensePlate} ficou livre.`
        });
    }
}

// --- Team Functions ---
export async function getAllTeams(): Promise<Team[]> {
    const q = query(collection(db, 'teams'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(t => docToObject<Team>(t));
}

export async function getTeam(id: string): Promise<Team | null> {
    const teamDoc = await getDoc(doc(db, 'teams', id));
    return teamDoc.exists() ? docToObject<Team>(teamDoc) : null;
}

export async function addTeam(teamData: Omit<Team, 'id'>) {
    return await addDoc(collection(db, 'teams'), teamData);
}

// --- Competition Functions ---
export async function getAllCompetitions(): Promise<Competition[]> {
    const q = query(collection(db, 'competitions'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(c => docToObject<Competition>(c));
}

export async function getCompetition(id: string): Promise<Competition | null> {
    const compDoc = await getDoc(doc(db, 'competitions', id));
    return compDoc.exists() ? docToObject<Competition>(compDoc) : null;
}

export async function addCompetition(compData: Omit<Competition, 'id'>) {
     const dataWithTimestamps = {
        ...compData,
        startDate: Timestamp.fromDate(new Date(compData.startDate)),
        endDate: Timestamp.fromDate(new Date(compData.endDate)),
    };
    return await addDoc(collection(db, 'competitions'), dataWithTimestamps);
}

export async function deleteCompetition(id: string) {
    await deleteDoc(doc(db, 'competitions', id));
}

export async function enrollInCompetition(competitionId: string, driverId: string) {
    const competitionRef = doc(db, 'competitions', competitionId);
    await updateDoc(competitionRef, {
        enrolledDriverIds: arrayUnion(driverId)
    });
}


// --- Challenge Functions ---
export async function getChallengesForDriver(driverId: string): Promise<Challenge[]> {
    const q1 = query(collection(db, 'challenges'), where('challengerId', '==', driverId));
    const q2 = query(collection(db, 'challenges'), where('opponentId', '==', driverId));
    
    const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);

    const challenges = new Map<string, Challenge>();
    snap1.docs.forEach(c => challenges.set(c.id, docToObject<Challenge>(c)));
    snap2.docs.forEach(c => challenges.set(c.id, docToObject<Challenge>(c)));

    return Array.from(challenges.values());
}

export async function addChallenge(challengeData: Omit<Challenge, 'id'>) {
     const dataWithTimestamps = {
        ...challengeData,
        startDate: Timestamp.fromDate(new Date(challengeData.startDate)),
        endDate: Timestamp.fromDate(new Date(challengeData.endDate)),
    };
    return await addDoc(collection(db, 'challenges'), dataWithTimestamps);
}

export async function updateChallenge(id: string, data: Partial<Challenge>) {
    const dataWithTimestamps = { ...data } as any;
    if(data.startDate) dataWithTimestamps.startDate = Timestamp.fromDate(new Date(data.startDate));
    if(data.endDate) dataWithTimestamps.endDate = Timestamp.fromDate(new Date(data.endDate));
    
    await updateDoc(doc(db, 'challenges', id), dataWithTimestamps);
}

// --- Ranking History ---
export async function getRankingHistory(): Promise<RankHistory[]> {
    const q = query(collection(db, 'rankingHistory'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(h => docToObject<RankHistory>(h));
}


// --- Fleet History ---
export async function addFleetChangeLog(logData: Omit<FleetChangeLog, 'id'>) {
    const dataWithTimestamp = {
        ...logData,
        date: Timestamp.now()
    };
    return await addDoc(collection(db, 'fleetChangeLog'), dataWithTimestamp);
}

export async function getFleetChangeLog(): Promise<FleetChangeLog[]> {
    const q = query(collection(db, 'fleetChangeLog'), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(l => docToObject<FleetChangeLog>(l));
}


// --- Logged In User ---
export async function getLoggedInDriver(): Promise<Driver | null> {
    await authInitialized;
    const user = auth.currentUser;
    if (user) {
        try {
            const driver = await getDriver(user.uid);
            // Don't return anything if the user is a "free vehicle" placeholder
            if (driver && driver.name === '[VEÍCULO LIVRE]') {
                return null;
            }
            return driver;
        } catch (error) {
            console.error("Error fetching driver data for logged in user:", error);
            return null;
        }
    }
    return null;
}
