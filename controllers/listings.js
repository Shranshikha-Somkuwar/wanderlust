const Listing = require("../models/listing");
const axios = require("axios");


module.exports.index = async (req, res) => {
    const { category, country } = req.query;

    let allListings;

    if (category && country) {
        allListings = await Listing.find({
            category: category,
            country: { $regex: country, $options: "i" }
        });
    } 
    else if (category) {
        allListings = await Listing.find({
            category: category
        });
    } 
    else if (country) {
        allListings = await Listing.find({
            country: { $regex: country, $options: "i" }
        });
    } 
    else {
        allListings = await Listing.find({});
    }

    res.render("listings/index.ejs", {
        allListings,
        category,
        country
    });
};

module.exports.renderNewForm =  (req, res) => {
            res.render("listings/new.ejs");

};

module.exports.showListing = async (req, res) => {
            let {id} = req.params;
            const listing = await Listing.findById(id)
            .populate({
            path: "reviews",
       populate: {
              path: "author",
       },
})
            .populate("owner");
            if(!listing) {
               req.flash("error", "Listing you requested for does not exist!");
               return res.redirect("/listings");
            }
            console.log(listing);
            res.render("listings/show.ejs", { listing });
};

module.exports.createListing = async (req, res, next) => {

    const location = req.body.listing.location;

    const response = await axios.get(
        "https://nominatim.openstreetmap.org/search",
        {
            params: {
                q: location,
                format: "json",
                limit: 1,
            },
            headers: {
                "User-Agent": "Wanderlust-App",
            },
        }
    );

    if (response.data.length === 0) {
        req.flash("error", "Location could not be found!");
        return res.redirect("/listings/new");
    }

    const lat = parseFloat(response.data[0].lat);
    const lon = parseFloat(response.data[0].lon);

    let url = req.file.path;
    let filename = req.file.filename;

    const newListing = new Listing(req.body.listing);

    newListing.owner = req.user._id;

    newListing.image = {
        url,
        filename
    };

    newListing.geometry = {
        type: "Point",
        coordinates: [lon, lat]
    };

    await newListing.save();

    req.flash("success", "New Listing Created!");
    res.redirect("/listings");
};

module.exports.renderEditForm = async (req, res) => {
              let {id} = req.params;
            const listing = await Listing.findById(id);
             if(!listing) {
               req.flash("error", "Listing you requested for does not exist!");
              return res.redirect("/listings");
            }

            let originalImageUrl = listing.image.url;
           originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
            res.render("listings/edit.ejs", { listing, originalImageUrl});

};

module.exports.updateListing = async (req, res) => {
            let { id } = req.params;
            let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing});
             

            if(typeof req.file != "undefined") {
            let url = req.file.path;
            let filename = req.file.filename;
            listing.image =  { url, filename };
            await listing.save();
            }
            req.flash("success", "Listing Updated!");
            res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
            let { id } = req.params;
            let deletedListing = await Listing.findByIdAndDelete(id);
            console.log(deletedListing);
            req.flash("success", "Listing Deleted!");
            res.redirect("/listings");
};
