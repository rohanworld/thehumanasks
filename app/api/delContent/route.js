import { NextResponse } from 'next/server';
import { db } from '@/utils/firebase';
import { collection, query, where, getDocs, writeBatch, getDoc } from 'firebase/firestore';

//not in use
export async function POST(req, res) {
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

        const batch = writeBatch(db); // Use db instead of firestore

        // Loop through each collection and delete old documents
        for (const collectionInfo of collections) {
            const q = query(
                collection(db, collectionInfo.name),
                where('createdAt', '<', thirtyDaysAgo)
            );
            const snapshot = await getDocs(q);

            for (const docSnap of snapshot.docs) {
                // Check if the likes subcollection exists
                const likesSubCollectionRef = collection(docSnap.ref, 'likes');
                const likesSnapshot = await getDocs(likesSubCollectionRef);
                const likesCount = likesSnapshot.size;

                if (likesCount < 10) {
                    // Delete subcollections
                    for (const subCollection of collectionInfo.subCollections) {
                        const subCollectionRef = collection(docSnap.ref, subCollection);
                        const subSnapshot = await getDocs(subCollectionRef);
                        subSnapshot.forEach(subDocSnap => {
                            batch.delete(subDocSnap.ref);
                        });
                    }
                    // Delete the main document
                    batch.delete(docSnap.ref);
                }
            }
        }

        await batch.commit();

        return NextResponse.json({
            message: 'Old content deleted successfully'
        }, {
            status: 200
        });
    } catch (error) {
        console.error('Error deleting old content:', error.message);
        return NextResponse.json({ error: 'Failed to delete old content' }, { status: 500 });
    }
}