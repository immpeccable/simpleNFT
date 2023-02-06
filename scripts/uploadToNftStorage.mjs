// Import the NFTStorage class and File constructor from the 'nft.storage' package
// Import the NFTStorage class and File constructor from the 'nft.storage' package
import { NFTStorage, File } from "nft.storage";

// The 'mime' npm package helps us set the correct file type on our File objects
import mime from "mime";

// The 'fs' builtin module on Node.js provides access to the file system
import fs from "fs";

// The 'path' module provides helpers for manipulating filesystem paths
import path from "path";

// Paste your NFT.Storage API key into the quotes:
const NFT_STORAGE_KEY = process.env.NFT_STORAGE_API_KEY;
const nftstorage = new NFTStorage({ token: NFT_STORAGE_KEY });
const IMAGES_BASE_PATH = "./images";

/**
 * Reads an image file from `imagePath` and stores an NFT with the given name and description.
 * @param {string} imagePath the path to an image file
 * @param {string} name a name for the NFT
 * @param {string} description a text description for the NFT
 */
async function storeNFT() {
  // load the file from disk
  const fullImagesPath = path.resolve(IMAGES_BASE_PATH);
  const files = fs.readdirSync(fullImagesPath);
  const tokenURIS = [];
  await new Promise(async (resolve, reject) => {
    let cnt = 0;
    files.forEach(async (file) => {
      const image = await fileFromPath(`${IMAGES_BASE_PATH}/${file}`);
      const description = `This is an dummy description for ${file}`;
      try {
        const response = await nftstorage.store({
          image: image,
          name: file,
          description: description,
          options: {},
        });
        cnt++;
        console.log(response);
        tokenURIS.push(response.url);
        if (cnt == files.length) {
          resolve();
        }
      } catch (e) {
        console.log(e);
      }
    });
  });
  fs.writeFileSync("./utils/tokenURIS.js", JSON.stringify(tokenURIS));
}

/**
 * A helper to read a file from a location on disk and return a File object.
 * Note that this reads the entire file into memory and should not be used for
 * very large files.
 * @param {string} filePath the path to a file to store
 * @returns {File} a File object containing the file content
 */
async function fileFromPath(filePath) {
  const content = await fs.promises.readFile(filePath);
  const type = mime.getType(filePath);
  return new File([content], path.basename(filePath), { type });
}

async function main() {
  const result = await storeNFT();
  console.log(result);
}

// Don't forget to actually call the main function!
// We can't `await` things at the top level, so this adds
// a .catch() to grab any errors and print them to the console.
main().catch((err) => {
  console.error(err);
  process.exit(1);
});
/**
 * The main entry point for the script that checks the command line arguments and
 * calls storeNFT.
 *
 * To simplify the example, we don't do any fancy command line parsing. Just three
 * positional arguments for imagePath, name, and description
 */
