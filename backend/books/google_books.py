import requests
from books.model import Book

GOOGLE_BOOKS_API = "https://www.googleapis.com/books/v1/volumes"

def search_and_save(query):
    """Search google books, save any new books to DB"""
    
    #check local first
    local_results = Book.objects.filter(title__icontains=query)[:10]
    
    if local_results.count() >= 5:
        return local_results
    
    #not found enough, search in google books
    
    try:
        response = requests.get(GOOGLE_BOOKS_API, params={
            "q": query,
            "maxResults": 10,
            "printType": "books",
            "langRestrict": "en",
        }, timeout=10)
        
        if response.status_code != 200:
            