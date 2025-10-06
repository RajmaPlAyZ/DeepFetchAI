import { collection, deleteDoc, doc, getDocs, orderBy, query, setDoc } from 'firebase/firestore'
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { db, storage } from './firebase'
import { NotificationService } from './notification-service'

export interface UploadedFile {
  id: string
  name: string
  url: string
  size: number
  type: string
  uploadedAt: string
  uploadedBy: string
  description?: string
}

export class UploadService {
  static async uploadFile(
    file: File, 
    userId: string, 
    description?: string
  ): Promise<UploadedFile> {
    if (!storage || !db) throw new Error('Firebase not initialized')
    
    const timestamp = Date.now()
    const fileName = `${timestamp}_${file.name}`
    const storageRef = ref(storage, `uploads/${userId}/${fileName}`)
    
    // Upload file to storage
    const snapshot = await uploadBytes(storageRef, file)
    const downloadURL = await getDownloadURL(snapshot.ref)
    
    // Save file metadata to Firestore
    const fileData: UploadedFile = {
      id: snapshot.ref.name,
      name: file.name,
      url: downloadURL,
      size: file.size,
      type: file.type,
      uploadedAt: new Date().toISOString(),
      uploadedBy: userId,
      description
    }
    
    await setDoc(doc(db, 'uploads', snapshot.ref.name), fileData)
    
    // Create notification for successful upload
    try {
      await NotificationService.notifyDocumentProcessed(userId, file.name)
    } catch (error) {
      console.error('Failed to create notification:', error)
    }
    
    return fileData
  }
  
  static async getUserUploads(userId: string): Promise<UploadedFile[]> {
    if (!db) throw new Error('Firebase not initialized')
    
    const uploadsRef = collection(db, 'uploads')
    const q = query(uploadsRef, orderBy('uploadedAt', 'desc'))
    const querySnapshot = await getDocs(q)
    
    return querySnapshot.docs
      .map(doc => doc.data() as UploadedFile)
      .filter(file => file.uploadedBy === userId)
  }
  
  static async getAllUploads(): Promise<UploadedFile[]> {
    if (!db) throw new Error('Firebase not initialized')
    
    const uploadsRef = collection(db, 'uploads')
    const q = query(uploadsRef, orderBy('uploadedAt', 'desc'))
    const querySnapshot = await getDocs(q)
    
    return querySnapshot.docs.map(doc => doc.data() as UploadedFile)
  }
  
  static async deleteFile(fileId: string, userId: string): Promise<void> {
    if (!db || !storage) throw new Error('Firebase not initialized')
    
    // Delete from Firestore
    await deleteDoc(doc(db, 'uploads', fileId))
    
    // Delete from Storage
    const storageRef = ref(storage, `uploads/${userId}/${fileId}`)
    await deleteObject(storageRef)
  }
  
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
}
