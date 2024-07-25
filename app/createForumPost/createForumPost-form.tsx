
"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState , Suspense } from "react";

import imageCompression from 'browser-image-compression';

import {
  Form,
  FormControl,
  FormLabel,
  FormField,
  FormItem,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { UseSelector, useSelector } from "react-redux";
import { forumPostURL } from "@/store/slice";

import {useForm} from "react-hook-form";
import { Controller } from "react-hook-form";

import { Tiptap } from "@/components/TipTapAns";
import { z } from "zod";
import {zodResolver} from "@hookform/resolvers/zod";
import { QuestionType } from "@/schemas/question";

import { auth , db , storage } from "@/utils/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { useRouter , useSearchParams } from "next/navigation";

import { addDoc, arrayUnion, collection, doc, getDoc, getDocs, onSnapshot, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore";
import { ref , uploadBytes, uploadBytesResumable , getDownloadURL} from "firebase/storage";
import { DialogClose } from "@radix-ui/react-dialog";

import algoliasearch from "algoliasearch/lite";
// import algoliasearch from "algoliasearch";
import { InstantSearch , SearchBox , Hits, Highlight } from "react-instantsearch";
import Post from "@/components/Post";

type Input = z.infer<typeof QuestionType>;

type Props = {}

const CreateForumPostPage = (props: Props) => {

    const router = useRouter();
  const searchParams = useSearchParams();
  const isGuest = searchParams.get('isGuest');
  const [user, loading] = useAuthState(auth);
  const [newPost, setNewPost] = useState(false);
  
  const { toast } = useToast();

  type SelectedCategoriesType = Record<string, string[]>;

  //system image upload stuff
  const [imageUpload , setImageUpload] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [progress , setProgress] = useState<number | null>(0);
  const [previewImg, setPreviewImg] = useState<any>(null);
  const [selectC, setSelectC] = useState<any>([]);
  const [selectedCategories, setSelectedCategories] = useState<SelectedCategoriesType>({});
  const [selectedMainCategory, setSelectedMainCategory] = useState('');
  const [subCategoryy, setSubCategoryy] = useState<any>(["SubCategory1", "SubCategory2", "SubCategory3"]);
  const [tempSubCategory, setTempSubCategory] = useState<any>([]);
  const [selectCategory, setSelectCategory] = useState<any>();
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [onFirstVisit, setOnFirstVisit] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState<string | undefined>('all');

  const handleSelectChange = (newValue: string | undefined) => {
    // setSelectedCategory(newValue);
    if(!selectC.includes(newValue)){
    setSelectC((prev:any)=>{
      return [...prev, newValue]
    })
  }
    console.log(selectC);
  };

  

  const uploadImage = async(file: any) => {
    if(file == null) return;

    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target) {
          const imageUrl = event.target.result;
          setPreviewImg(imageUrl);
        } else {
          console.error('Error reading file:', file);
          setPreviewImg(null);
        }
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewImg(null);
    }

    const storageRef = ref(storage, `forumsPost/${file.name}`);

    try {
      // Set compression options
    const options = {
      maxSizeMB: 1, // Max size in megabytes
      maxWidthOrHeight: 800, // Max width or height
      useWebWorker: true, // Use web worker for better performance (optional)
    };
  
      // Compress the image
      
      const compressedFile = await imageCompression(file, options);

    //uploading compressed file
    const uploadTask = uploadBytesResumable(storageRef, compressedFile);

    uploadTask.on('state_changed', 
    (snapshot:any) => {
      // You can use this to display upload progress
      const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      console.log('Upload is ' + progress + '% done');
      setProgress(progress);
    }, 
    (error: any) => {
      // Handle unsuccessful uploads
      console.log('Upload failed', error);
    }, 
    () => {
      // Upload completed successfully, now we can get the download URL
      getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
        console.log('File available at', downloadURL);
        // Save the URL to state or wherever you want to keep it
        setImageUrl(downloadURL);
      });
    }
  );}catch(err){
    console.error('Error compressing or uploading image:', err);
  }

  }

  //category stuff

  useEffect(()=>{
    const getCat=async()=>{
      try {
        const eventCategoriesRef = collection(db, 'meta-data', 'v1', 'event-categories');
        const snapshot = await getDocs(eventCategoriesRef);
    
        const eventCategories:any = [];
        snapshot.forEach(doc => {
          eventCategories.push({ id: doc.id, ...doc.data() });
        });
    
        return eventCategories;
      } catch (error) {
        console.error('Error fetching event categories:', error);
        return [];
      }
  }
  const category = getCat().then(categories => {
    setSelectCategory(categories);
  }).catch(error => {
    console.error('Error:', error);
  });
  }, [])
    
  const handleMainCategoryChange = (newValue: string) => {
    setTempSubCategory([]);
    if(!selectC.includes(newValue)){
      setSelectC((prev:any)=>{
        return [...prev, newValue]
      })
    }
    setSelectedMainCategory(newValue);
    handleCategorySelectChange(newValue, undefined);
  };

  const handleSubcategoryChange = (newValue: string) => {
    if(!tempSubCategory.includes(newValue)){
      setTempSubCategory((prev:any)=>{
        return [...prev, newValue]
      })
    }
    handleCategorySelectChange(selectedMainCategory, newValue);
    setSelectedSubcategory(newValue);
  };

  const handleCategorySelectChange = (category: string, subcategory: string | undefined) => {
    setSelectedCategories((prev: any) => {
      const updatedCategories = { ...prev };
      if (!updatedCategories[category]) {
        updatedCategories[category] = [];
      }
      if (subcategory && !updatedCategories[category].includes(subcategory)) {
        updatedCategories[category].push(subcategory);
      }
      return updatedCategories;
    });
    //console.log(selectedCategories);
  };

  const delCategories = (category:string)=>{
    let newCategory=selectC.filter((cat:any)=>{
      console.log(cat, " ", category);
      return cat!=category;
    })
  setSelectC(newCategory);
  delete selectedCategories[category]
  //console.log(selectedCategories);
  }

  const delSubCategories = (category:string)=>{
    let newSubCategory=tempSubCategory.filter((cat:any)=>{
      return cat!=category;
    })
  setTempSubCategory(newSubCategory);
  selectedCategories[selectedMainCategory]=selectedCategories[selectedMainCategory].filter((subcat)=>(
    subcat!=category
  ))
  //console.log(selectedCategories);
  }

  //fetching current forum url
  const ForumPostURL = sessionStorage.getItem('devotionalforumUrl');

  const [name, setName] = useState<string>(user?.displayName||"loading...");


    const form = useForm<Input>({
        // mode: "onSubmit",
        // mode: "onChange",
        resolver: zodResolver(QuestionType),
        defaultValues: {
          title: "",
          description: "",
          questionImageURL: "",
          anonymity: false,
        },
      });
    
      async function createForumPost(data: Input) {
        
        //console.log("creating");
    
        const docRef = await addDoc(collection(db, "forumPosts"), {
          title: data.title,
          description: data.description,
          uid: user?.uid,
          profilePic: user?.photoURL,
          name: name||user?.displayName,
          createdAt: serverTimestamp(),
          questionImageURL: imageUrl,
          forumName: ForumPostURL,
          anonymity: data.anonymity,
          // ansNumbers: 0,
        });
    
        const quesId = docRef.id;

        const forumName = ForumPostURL;

  // Create a query to find the forum with the uniqueForumName
  const forumQuery = query(collection(db, "forums"), where("uniqueForumName", "==", forumName));

  try {
    const forumSnapshot = await getDocs(forumQuery);

    if (forumSnapshot.empty) {
      console.error("Forum not found.");
      return;
    }

    const forumDoc = forumSnapshot.docs[0];
    const forumRef = doc(db, "forums", forumDoc.id);

    const docSnap = await getDoc(forumRef);

    if (docSnap.exists()) {
      const forumData = docSnap.data();
      const numOfPosts = forumData.numOfPosts || 0;

      // Update numOfPosts
      if (numOfPosts === 0) {
        // If numOfPosts is 0 or not present, set it to 1
        await setDoc(forumRef, { numOfPosts: 1 }, { merge: true });
      } else {
        // Increment numOfPosts by 1
        await updateDoc(forumRef, { numOfPosts: numOfPosts + 1 });
      }

      console.log("NumOfPosts updated successfully.");
      // toast({
      //   title: "Forum Updated",
      //   description: "NumOfPosts updated successfully.",
      // });

      // router.push("/forums");
    } else {
      console.error("Forum document not found.");
    }
  } catch (error) {
    console.error("Error updating document: ", error);
  }
    
        toast({
          title: "Posted Sucessfully",
          description: "Your post has been posted successfully.",
        });

        router.push(`/forums/${ForumPostURL}`);
    
      }
    
      function onSubmit(data: Input) {
        // console.log(data);
    
        createForumPost(data);
        //setNewPost((prev)=>!prev);
        
      }
    
      const guestHandler = ()=>{
        if(user?.isAnonymous){
        auth.signOut();
        router.push("/auth");
        }
      }

      console.log("FORUMP: ", ForumPostURL);
    
  return (
    <div>
        <div className="  w-full cursor-pointer">
                      <Form {...form}>
                        <form
                        className="relative space-y-9 "
                        onSubmit={form.handleSubmit(onSubmit)}
                        >

                          {/* Title */}
                          <FormField
                          control={form.control}
                          name="title"
                          render = {({field}) => (
                            <FormItem>
                              <FormLabel>Title</FormLabel>
                              <FormControl>
                                <Input className="" placeholder="Title for the question ..." {...field}/>
                              </FormControl>
                              <div className="font-style-7-hint opacity-70">This is the title, write your Post here.</div>
                              <FormMessage/>
                            </FormItem>
                          )}
                          />

                          {/* TipTap Editor */}
                          <FormField
                            control={form.control}
                            name="description"
                            render = {({field}) => (
                              <FormItem>
                                <FormLabel>Description</FormLabel>
                                <div className={`${isFocused?"border-black border-[2.1px]": "border-[1.2px]"} rounded-lg`} onFocus={() => setIsFocused(true)}
                                  onBlur={() => setIsFocused(false)}
                                  >
                                <FormControl>
                                  <Controller
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                      <Tiptap {...field} setImageUpload={setImageUpload} uploadImage={uploadImage} progress={progress} />
                                    )}
                                   /> 
                                </FormControl>
                                </div>
                                <div className="font-style-7-hint opacity-70">This is the description, give more details about your Post here.</div>
                                <FormMessage/>
                              </FormItem>
                            )}
                          />
                          
                          {(progress||0)>0&&<span className='pt-3'>{`${Math.ceil((progress||0))} % Uploaded`}</span>}
                          {/* "0" to make upload percentage invisible when no image is selected */}
                          {/* anonymity toggle */}

                          <div>
                            {
                              previewImg&&<div className="w-full flex items-center justify-center">
                                <Image src={previewImg} alt="previewImage" width={250} height={250}/>
                              </div>
                            }
                          </div>
                          <div>
                            
                          </div>
                          <FormField
                            control={form.control}
                            name="anonymity"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-2">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-sm font-medium">
                                    Post Anonymously
                                    <div className="font-style-7-hint font-normal opacity-70">Hide your details while posting question</div>
                                  </FormLabel>
                                  {/* <FormDescription>
                                    Post question without revealing your identity.
                                  </FormDescription> */}
                                </div>
                                <div className="mb-5">
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                </div>
                              </FormItem>
                            )}
                          />

                              <Button type="submit" 
                                className="font-style-4 w-full"
                                // disabled={isGuest === 'true'}
                              >
                                Post
                              </Button>
                            
                          

                        </form>
                      </Form>
                      </div>

    </div>
  )
}

export default CreateForumPostPage;