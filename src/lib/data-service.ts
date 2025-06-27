
import { db, auth, authInitialized } from './firebase';
import { collection, getDocs, doc, getDoc, setDoc, query, where, addDoc, updateDoc, deleteDoc, Timestamp, arrayUnion } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import type { Driver, Team, Competition, Challenge, RankHistory } from './data-types';

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
}

export async function deleteDriver(id: string) {
    // Note: This only deletes the Firestore record, not the Firebase Auth user.
    // Deleting an auth user requires admin privileges or re-authentication,
    // which is better handled in a server environment.
    await deleteDoc(doc(db, 'drivers', id));
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


// --- Logged In User ---
export async function getLoggedInDriver(): Promise<Driver | null> {
    await authInitialized;
    const user = auth.currentUser;
    if (user) {
        try {
            const driver = await getDriver(user.uid);
            return driver;
        } catch (error) {
            console.error("Error fetching driver data for logged in user:", error);
            return null;
        }
    }
    return null;
}

    