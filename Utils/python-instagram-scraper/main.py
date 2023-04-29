from insta_scraper import InstagramScraper
import argparse
import logging
import os

logging.basicConfig(level=logging.INFO)

def main():

	parser = argparse.ArgumentParser(description='Instagram followers scrapper')
	parser.add_argument('--username', dest='username', action='store')
	parser.add_argument('--password', dest='password', action='store')
	args = parser.parse_args()

	scrapper = InstagramScraper(args.username, args.password)
	logging.info("Creating session")
	scrapper.create_session()

	logging.info("Extracting followers")
	scrapper.scrape_followers()

	logging.info("Generating followers list. Please check followers text file")
	scrapper.generate_followers_list()

if __name__ == '__main__':
	main()