import instaloader
import numpy as np

class InstagramScraper:

    def __init__(self, username, password):
        
        self.username = username
        self.password = password
        self.profile = None
        self.followers_list = []

    def create_session(self):
        
        L = instaloader.Instaloader()
        try:
            L.load_session_from_file(self.username, self.username + self.password)
        except:
            L.login(self.username, self.password) # Login or load session
            L.save_session_to_file(self.username + self.password)
        self.profile = instaloader.Profile.from_username(L.context, 'gelemisvillage') # Obtain profile metadata

    def scrape_followers(self):
       
        for follower in self.profile.get_followers():
            self.followers_list.append(follower.username)

    def generate_followers_list(self):

        print("Followers: ", self.followers_list)
        filename = "followers.txt"
        file = open(filename, "w")
        for person in self.followers_list:
            file.write(person + "\n")
        file.close()


