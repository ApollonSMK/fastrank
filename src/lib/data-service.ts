
import { db, auth, authInitialized } from './firebase';
import { collection, getDocs, doc, getDoc, setDoc, query, where, addDoc, updateDoc, deleteDoc, Timestamp, arrayUnion, orderBy, limit } from 'firebase/firestore';
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
export async function signUpUser(driverData: Partial<Omit<Driver, 'id' | 'authUid'>>, password: string): Promise<void> {
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
        authUid: user.uid,
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
    
    await addDoc(collection(db, 'drivers'), newDriver);
}

export async function signInUser(email: string, password: string): Promise<void> {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // After successful sign-in, check if the driver document is correctly linked.
    const q = query(collection(db, "drivers"), where("authUid", "==", user.uid), limit(1));
    const snapshot = await getDocs(q);

    // If no document is found with the authUid, try to find one by email and repair the link.
    if (snapshot.empty) {
        console.warn(`No driver document found for UID ${user.uid}. Attempting to repair link via email.`);
        const qByEmail = query(collection(db, "drivers"), where("email", "==", user.email), limit(1));
        const snapshotByEmail = await getDocs(qByEmail);

        if (!snapshotByEmail.empty) {
            const driverDoc = snapshotByEmail.docs[0];
            // Found a driver by email. If its authUid is missing or null, update it.
            if (!driverDoc.data().authUid) {
                console.log(`Found unlinked driver document ${driverDoc.id} for email ${user.email}. Updating authUid.`);
                await updateDoc(doc(db, 'drivers', driverDoc.id), { authUid: user.uid });
            }
        }
    }
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
    const q = query(collection(db, "drivers"), where("teamId", "==", teamId));
    const snapshot = await getDocs(q);
    // Filter out free vehicles on the client side after fetching
    return snapshot.docs.map(doc => docToObject<Driver>(doc)).filter(driver => driver.name !== '[VEÍCULO LIVRE]');
}

export async function updateDriver(id: string, data: Partial<Driver>) {
    await updateDoc(doc(db, 'drivers', id), data);
}

export async function assignDriverToVehicle(vehicleId: string, driverData: Omit<Driver, 'id' | 'authUid' | 'licensePlate' | 'vehicleModel' | 'licensePlateHistory' | 'rank' | 'points' | 'moneyBalance' | 'trips' | 'safetyScore' | 'efficiency' | 'dailyDeliveries' | 'notifications' | 'achievementIds'>, password: string) {
    const vehicle = await getDriver(vehicleId);
    if (!vehicle || vehicle.name !== '[VEÍCULO LIVRE]') {
        throw new Error("Vehicle not found or is not available.");
    }
    if (!driverData.email) {
         throw new Error("Email is required.");
    }

    // Check if email is already in use by another driver document.
    const q = query(collection(db, "drivers"), where("email", "==", driverData.email));
    const querySnapshot = await getDocs(q);
    
    // Filter out free vehicles in the client code to avoid needing a composite index
    const existingDrivers = querySnapshot.docs.map(doc => doc.data()).filter(d => d.name !== '[VEÍCULO LIVRE]');

    if (existingDrivers.length > 0) {
        const error: any = new Error("Email is already in use.");
        error.code = 'auth/email-already-in-use';
        throw error;
    }


    const userCredential = await createUserWithEmailAndPassword(auth, driverData.email, password);
    const user = userCredential.user;

    const updates: Partial<Driver> = {
        authUid: user.uid,
        name: driverData.name,
        email: driverData.email,
        teamId: driverData.teamId,
        avatar: driverData.avatar || '/avatars/default.png',
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

    await updateDriver(vehicleId, updates);

    await addFleetChangeLog({
        driverId: vehicleId,
        driverName: driverData.name,
        changeDescription: `Motorista ${driverData.name} associado ao veículo ${vehicle.licensePlate}.`
    });
}


export async function addFreeVehicle(data: { licensePlate: string; vehicleModel: string; }) {
    const initialHistory: VehicleHistoryEntry = {
        licensePlate: data.licensePlate,
        vehicleModel: data.vehicleModel,
        assignedDate: new Date().toISOString(),
        unassignedDate: null,
    };
    
    const freeVehicle: Omit<Driver, 'id'> = {
        authUid: null,
        name: '[VEÍCULO LIVRE]',
        email: '',
        licensePlate: data.licensePlate,
        vehicleModel: data.vehicleModel,
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
        licensePlateHistory: [initialHistory],
    };

    const docRef = await addDoc(collection(db, 'drivers'), freeVehicle);

    await addFleetChangeLog({
        driverId: docRef.id,
        driverName: '[VEÍCULO LIVRE]',
        changeDescription: `Novo veículo livre adicionado: ${data.vehicleModel} (${data.licensePlate}).`
    });
}


export async function deleteDriver(id: string) {
    const driverToDelete = await getDriver(id);
    if (!driverToDelete) return;
    
    if (driverToDelete.name === '[VEÍCULO LIVRE]') {
        await addFleetChangeLog({
            driverId: id,
            driverName: '[VEÍCULO LIVRE]',
            changeDescription: `Veículo ${driverToDelete.licensePlate} removido permanentemente.`
        });
        await deleteDoc(doc(db, 'drivers', id));
    } else {
        const updates: Partial<Driver> = {
            name: '[VEÍCULO LIVRE]',
            email: '',
            authUid: null,
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
        
        await updateDoc(doc(db, 'drivers', id), updates as any);

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
            const q = query(collection(db, "drivers"), where("authUid", "==", user.uid), limit(1));
            const snapshot = await getDocs(q);
            
            if (!snapshot.empty) {
                const driver = docToObject<Driver>(snapshot.docs[0]);
                if (driver.name === '[VEÍCULO LIVRE]') {
                    return null;
                }
                return driver;
            }

            // User is authenticated but has no driver document.
            // Let's try to find one by email and repair the link.
            const qByEmail = query(collection(db, "drivers"), where("email", "==", user.email), limit(1));
            const snapshotByEmail = await getDocs(qByEmail);

            if (!snapshotByEmail.empty) {
                const driverDoc = snapshotByEmail.docs[0];
                const driverData = driverDoc.data();
                if (driverData.name !== '[VEÍCULO LIVRE]' && !driverData.authUid) {
                    await updateDoc(doc(db, 'drivers', driverDoc.id), { authUid: user.uid });
                    const repairedDoc = await getDoc(doc(db, 'drivers', driverDoc.id));
                    return docToObject<Driver>(repairedDoc);
                }
            }

            // If still no document, create one for the admin/new user.
            const initialHistory: VehicleHistoryEntry = {
                licensePlate: 'N/A',
                vehicleModel: 'Sem Veículo',
                assignedDate: new Date().toISOString(),
                unassignedDate: null,
            };

            const newDriverData: Omit<Driver, 'id'> = {
                authUid: user.uid,
                name: user.displayName || user.email?.split('@')[0] || 'Novo Motorista',
                email: user.email!,
                avatar: user.photoURL || '/avatars/default.png',
                rank: 999,
                points: 0,
                moneyBalance: 0,
                trips: 0,
                safetyScore: 100,
                efficiency: 100,
                teamId: '',
                licensePlate: 'N/A',
                vehicleModel: 'Sem Veículo',
                dailyDeliveries: [],
                notifications: [],
                achievementIds: [],
                licensePlateHistory: [initialHistory],
            };

            const docRef = await addDoc(collection(db, 'drivers'), newDriverData);
            const newDriverDoc = await getDoc(docRef);
            return docToObject<Driver>(newDriverDoc);

        } catch (error) {
            console.error("Error in getLoggedInDriver:", error);
            return null;
        }
    }
    return null;
}
