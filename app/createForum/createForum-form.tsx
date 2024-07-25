
"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState , Suspense } from "react";

import imageCompression from 'browser-image-compression';

import {Home as HomeIcon , Search } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";

import CustomFeed from "@/components/CustomFeed";
import RightHandFeed from "@/components/RightHandFeed/RightHandFeed";
import TopFeedCard from "@/components/TopFeedCard";
import Loader from "@/components/ui/Loader";
import { LuXCircle } from "react-icons/lu";

import {
  signInAnonymously, updateProfile,
} from "firebase/auth";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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

import {useForm} from "react-hook-form";
import { Controller } from "react-hook-form";

import { Tiptap } from "@/components/TipTapAns";
import { z } from "zod";
import {zodResolver} from "@hookform/resolvers/zod";
import { ForumType } from "@/schemas/forum";

import { auth , db , storage } from "@/utils/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { useRouter , useSearchParams } from "next/navigation";

import { addDoc, arrayUnion, collection, doc, getDoc, getDocs, onSnapshot, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { ref , uploadBytes, uploadBytesResumable , getDownloadURL} from "firebase/storage";
import { DialogClose } from "@radix-ui/react-dialog";

import algoliasearch from "algoliasearch/lite";
// import algoliasearch from "algoliasearch";
import { InstantSearch , SearchBox , Hits, Highlight } from "react-instantsearch";
import Post from "@/components/Post";

type Input = z.infer<typeof ForumType>;

type Props = {}

const CreateForumPage = (props: Props) => {

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
  const [bannerImgUrl, setBannerImgUrl] = useState<string|null>(null);
  const [progress , setProgress] = useState<number | null>(0);
  const [bannerProgress, setBannerProgress] = useState<number|null>(0);
  const [previewImg, setPreviewImg] = useState<any>(null);
  const [bannerPreviewImg, setBannerPreviewImg] = useState<any>(null);
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

  //for uploading banner image
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

    const storageRef = ref(storage, `forums/${file.name}`);

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
        setBannerImgUrl(downloadURL);
      });
    }
  );}catch(err){
    console.error('Error compressing or uploading image:', err);
  }

  }

  const uploadForumLogo = async(file: any) => {
    if(file == null) return;

    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target) {
          const imageUrl = event.target.result;
          setBannerPreviewImg(imageUrl);
        } else {
          console.error('Error reading file:', file);
          setBannerPreviewImg(null);
        }
      };
      reader.readAsDataURL(file);
    } else {
      setBannerPreviewImg(null);
    }

    const storageRef = ref(storage, `forums/${file.name}`);

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
      const bannerProgress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      console.log('Upload is ' + bannerProgress + '% done');
      setBannerProgress(bannerProgress);
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

  const [name, setName] = useState<string>(user?.displayName||"loading...");


    const form = useForm<Input>({
        // mode: "onSubmit",
        // mode: "onChange",
        resolver: zodResolver(ForumType),
        defaultValues: {
            uniqueForumName: "",
            name: "",
            description: "",
            imageURL: "",
            forumLogo: "",
            bannerImageURL: "",
            rules: "",
        },
      });
    
      async function createForum(data: Input) {
        
        //console.log("creating");
    
        const docRef = await addDoc(collection(db, "forums"), {
          uniqueForumName: data.uniqueForumName.split(" ").join("-"),
          name: data.name,
          description: data.description,
          uid: user?.uid,
          profilePic: user?.photoURL,
          userName: name||user?.displayName,
          createdAt: serverTimestamp(),
          imageURL: imageUrl,
          bannerImageURL: bannerImgUrl,
          category: selectC,
          rules: data.rules,
          noOfMembers: 1,

          // ansNumbers: 0,
        });
    
        //const quesId = docRef.id;
    
        toast({
          title: "Forum Created",
          description: "Your forum has been created successfully.",
        });

        router.push(`/forums/${data.uniqueForumName.split(" ").join("-")}`);
    
        try {
          for (const [mainCategory, subcategories] of Object.entries(selectedCategories)) {
            // Update Firestore for main category
            await updateDoc(doc(db, 'meta-data', 'v1', 'forum-categories', mainCategory), {
              Posts: arrayUnion(docRef.id),
            });
      
            // Update Firestore for each subcategory
            for (const subcategory of subcategories) {
              await updateDoc(doc(db, 'meta-data', 'v1', 'forum-categories', mainCategory), {
                [subcategory]: arrayUnion(docRef.id),
              });
            }
          }
      
          // Clear selected categories after submission
          setSelectedCategories({});
        } catch (error) {
          console.error('Error updating Firestore:', error);
        }
    
        console.log("Document written with ID: ", docRef.id);
        //console.log(data);
      }
    
      function onSubmit(data: Input) {
        // console.log(data);
    
        createForum(data);
        //setNewPost((prev)=>!prev);
        
      }
    
      const guestHandler = ()=>{
        if(user?.isAnonymous){
        auth.signOut();
        router.push("/auth");
        }
      }
    
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
                          name="uniqueForumName"
                          render = {({field}) => (
                            <FormItem>
                              <FormLabel>Forum Name</FormLabel>
                              <FormControl>
                                <Input className="" placeholder="Give a Unique Forum Name..." {...field}/>
                              </FormControl>
                              <div className="font-style-7-hint opacity-70">This is for forum url, Give a Unique Forum Name here</div>
                              <FormMessage/>
                            </FormItem>
                          )}
                          />
                           
                          <FormField
                          control={form.control}
                          name="name"
                          render = {({field}) => (
                            <FormItem>
                              <FormLabel>Display Name</FormLabel>
                              <FormControl>
                                <Input className="" placeholder="Give a name to your Forum" {...field}/>
                              </FormControl>
                              <div className="font-style-7-hint opacity-70">This name will be visible to the users, Give a Forum Name here</div>
                              <FormMessage/>
                            </FormItem>
                          )}
                          />

                          <FormField
                          control={form.control}
                          name="forumLogo"
                          render = {({field}) => (
                            <FormItem>
                              <FormLabel>Upload forum logo</FormLabel>
                              <FormControl>
                                <Input type="file" onChange={(e) => {
                                  if(e.target.files){
                                  uploadForumLogo(e.target.files[0])
                                  }

                                  }} className="" placeholder="Give a name to your Forum" />
                              </FormControl>
                              <div className="font-style-7-hint opacity-70">Upload a logo for your Forum here.</div>
                              <FormMessage/>
                            </FormItem>
                          )}
                          
                          />
                          <div>
                          <div>
                            {
                              bannerPreviewImg&&<div className="w-full flex items-center justify-center">
                                <Image src={bannerPreviewImg} alt="previewImage" width={250} height={250}/>
                              </div>
                            }
                          </div>
                          <div>
                          {
                          (bannerProgress||0)>0&&
                          <Progress value={bannerProgress} className=" w-full z-10"/>
                          }
                          </div>
                          {(bannerProgress||0)>0&&<span className='pt-3'>{`${Math.ceil((bannerProgress||0))} % Uploaded`}</span>}
                          </div>

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
                                <div className="font-style-7-hint opacity-70">Give a description and set banner of your forum from here.</div>
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
                            <div className="text-sm font-medium mb-2">Category</div>
                          <Select value={""} onValueChange={handleMainCategoryChange} >
      <SelectTrigger className="w-full">
      <SelectValue placeholder="Select a Category" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Categories</SelectLabel>
          <div>
              {
                selectCategory?
                selectCategory.map((categoryD:any, index:any)=>(
                  <div key={index}>
                    <SelectItem value={categoryD.id}>{categoryD.id.split("|").join("/")}</SelectItem>
                  </div>
                )):
                <div><Loader/></div>
              }
            </div>
          <SelectItem value="Others">Others</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
    <div className="flex">
                              {
                                selectC.map((category:string, index:number)=>{
                                  return <span className='bg-slate-300 text-slate-800 rounded-xl p-1 text-sm flex mr-1 mt-3' key={index}>{category.split("|").join("/")} <span onClick={()=>{delCategories(category)}} className="mt-[0.27rem] ml-1 cursor-pointer text-slate-800 hover:text-slate-900"><LuXCircle /></span></span>
                                })
                              }
                            </div>
                            <div className="mt-3">
                            {selectedMainCategory && (
                              <Select value={""} onValueChange={handleSubcategoryChange}>
                                <SelectTrigger>
                                <SelectValue placeholder={`Select subCategory for ${selectedMainCategory.split("|").join("/")}`} />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectGroup>
                                  <SelectLabel>Sub Categories</SelectLabel>
                                    {
                                      subCategoryy.map((subcategory:any, index:any)=>(
                                        <SelectItem key={index} value={subcategory}>{subcategory}</SelectItem>
                                      ))
                                    }
                                    {/* Add more subcategories for other main categories */}
                                  </SelectGroup>
                                </SelectContent>
                              </Select>
                            )}
                            <div className="flex">
                              {
                                tempSubCategory.map((subcategory:string, index:number)=>{
                                  return <span className='bg-slate-300 text-slate-800 rounded-xl p-1 text-sm flex mr-1 mt-3' key={index}>{subcategory} <span onClick={()=>{delSubCategories(subcategory)}} className="mt-[0.27rem] ml-1 cursor-pointer text-slate-800 hover:text-slate-900"><LuXCircle /></span></span>
                                })
                              }
                            </div>
                            </div>
                            <div className="text-[12px] opacity-70 mt-[0.45rem]">This is the category, you can choose multiple categories for your Question.</div>
                          </div>
                          <FormField
                          control={form.control}
                          name="rules"
                          render = {({field}) => (
                            <FormItem>
                              <FormLabel>Set Rules for Forum</FormLabel>
                              <FormControl>
                                <Input className="" placeholder="Set Some Rules for your Forum" {...field}/>
                              </FormControl>
                              <div className="font-style-7-hint opacity-70">Here you can write some Rules for the forum</div>
                              <FormMessage/>
                            </FormItem>
                          )}
                          />

                              <Button type="submit" 
                                className="font-style-4"
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

export default CreateForumPage