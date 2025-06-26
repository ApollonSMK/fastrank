
import { db } from './firebase';
import { collection, getDocs, doc, getDoc, query, where, addDoc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
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

export async function updateDriver(id: string, data: Partial<Driver>) {
    await updateDoc(doc(db, 'drivers', id), data);
}

export async function addDriver(driverData: Omit<Driver, 'id'>) {
    return await addDoc(collection(db, 'drivers'), driverData);
}

export async function deleteDriver(id: string) {
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
export function getLoggedInDriverId(): string | null {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('loggedInDriverId');
    }
    return null;
}

export async function getLoggedInDriver(): Promise<Driver | null> {
    const driverId = getLoggedInDriverId();
    if (driverId) {
        return getDriver(driverId);
    }
    return null;
}
