import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

//CleanUp function for posts...
// Not in Use
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(require('/path/to/your/serviceAccountKey.json')),
    });
}

const firestore = getFirestore();

export async function delContent(req, res) {
    try {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));

        // Define collections and their subcollections to delete
        const collections = [
            { name: 'questions', subCollections: ['answers'] },
            { name: 'polls', subCollections: ['pollAnswers'] },
            { name: 'events', subCollections: ['eventComments'] },
            { name: 'forumPosts', subCollections: ['forumPostAnswers'] }
        ];

        const batch = firestore.batch();

        // Loop through each collection and delete old documents
        for (const collectionInfo of collections) {
            const q = firestore.collection(collectionInfo.name)
                .where('createdAt', '<', thirtyDaysAgo)
                .where('likes', '<', 10);
            const snapshot = await q.get();

            for (const docSnap of snapshot.docs) {
                // Delete subcollections
                for (const subCollection of collectionInfo.subCollections) {
                    const subCollectionRef = docSnap.ref.collection(subCollection);
                    const subSnapshot = await subCollectionRef.get();
                    subSnapshot.forEach(subDocSnap => {
                        batch.delete(subDocSnap.ref);
                    });
                }
                // Delete the main document
                batch.delete(docSnap.ref);
            }
        }

        await batch.commit();
        res.status(200).json({ message: 'Old content deleted successfully' });
    } catch (error) {
        console.error('Error deleting old content:', error);
        res.status(500).json({ error: 'Failed to delete old content' });
    }
}