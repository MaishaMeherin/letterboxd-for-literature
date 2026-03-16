import { create } from "zustand";

const useAuthStore = create((set) => ({
  //state
  user: null,
  username: null,

  setUser: (user) => set({ user }),
  setUsername: (username) => set({ username }),
  logout: () => set({ user: null }),
}));

const useBookStore = create((set) => ({
  books: [],
  book: null, //current single book in BookPage
  reviews: [],
  selectedBook: null,

  setBooks: (books) => set({ books }),
  setBook: (book) => set({ book }),
  setReviews: (reviews) => set({ reviews }),
  setSelectedBook: (book) => set({ selectedBook: book }),
}));

const useReviewFormStore = create((set) => ({
  reviewText: "",
  containsSpoilers: false,                
  rating: 0,
  existingReview: null,             

  setReviewText: (reviewText) => set({ reviewText }),
  setContainsSpoilers: (containsSpoilers) => set({ containsSpoilers }),
  setRating: (rating) => set({ rating }),
  setExistingReview: (existingReview) => set({ existingReview }), 
  reset: () => set({ rating: 0, reviewText: "", containsSpoilers: false, existingReview: null }),
}));

const useLogFormStore = create((set) => ({
  status: "want_to_read",
  dateStarted: "",
  dateFinished: "",
  currentPage: 0,
  notes: "",
  existingLog: null,
  logs: [],                             

  setLogs: (logs) => set({ logs }),        
  setExistingLog: (existingLog) => set({ existingLog }),
  setStatus: (status) => set({ status }),
  setDateStarted: (dateStarted) => set({ dateStarted }),  
  setDateFinished: (dateFinished) => set({ dateFinished }), 
  setCurrentPage: (currentPage) => set({ currentPage }),   
  setNotes: (notes) => set({ notes }),   
  reset: () => set({                       
    status: "want_to_read", dateStarted: "", dateFinished: "",
    currentPage: 0, notes: "", existingLog: null,
  }),
}));


const usePlaylistStore = create((set) => ({
  playlist: [],

  setPlaylist: (playlist) => set({ playlist }),
}))

export { useAuthStore, useBookStore, useReviewFormStore, useLogFormStore, usePlaylistStore };