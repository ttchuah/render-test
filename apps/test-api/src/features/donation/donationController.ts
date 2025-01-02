import _ from "lodash";
import PDFDocument from "pdfkit";
import moment from "moment";
import { getFirstAndLastDaysOfLastMonth } from "../../utilities/helpers";
import { getSearchConditions, getTaxReceiptData, generateEnvelopePdf, generateReceiptPdf, sortDonors } from "./utils";
import mongoose, { Document, Model } from "mongoose";
import {Donation} from "../donation/donationModel";
import {Organization} from "../organization/organizationModel";

// const Donation: Model<IDonation> = mongoose.model<IDonation>("Donation");
// const Organization: Model<IOrganization> = mongoose.model<IOrganization>("Organization");

export const getDashboardStats = async (req, res) => {
    let organizationIDs = req.decoded.organizations;
    organizationIDs = organizationIDs.map(
        (id) => new mongoose.Types.ObjectId(id)
    );

    const { startDate, endDate } = getFirstAndLastDaysOfLastMonth();
    console.log(
        moment(startDate, "YYYYMMDD").toISOString(),
        moment(endDate, "YYYYMMDD").toISOString()
    );

    const stats = await Donation.aggregate([
        {
            $match: {
                "folder.date": {
                    $gte: moment(startDate, "YYYYMMDD").toDate(),
                    $lte: moment(endDate, "YYYYMMDD").toDate(),
                },
                "organization._id": {
                    $in: organizationIDs,
                },
            },
        },
        {
            $sort: {
                "organization.name": 1,
                currency: -1,
            },
        },
        {
            $group: {
                _id: {
                    organization: "$organization.name",
                    currency: "$currency",
                },
                total: {
                    $sum: "$amount",
                },
            },
        },
    ]);

    res.json(stats);
};

export const getDonations = async (req, res) => {
    const searchParams = getSearchConditions(req);
    const donations = await Donation
        .find(searchParams)
        .populate({
            path: "donor"
        });

    res.json(donations.sort((donation1, donation2) => {
        const {donor: donor1} = donation1;
        const {donor: donor2} = donation2;
        return sortDonors(donor1, donor2);
    }));
};

export const createDonations = async (req, res) => {
    const array = req.body;
    let results = [];

    const [organization] = req.decoded.organizations;
    if (!organization) {
        res.status(500).send("Unable to find organization for this user.");
        return;
    }

    const organizationInfo = await Organization.findOne({
        _id: organization,
    });
    if (!organizationInfo) {
        res.status(500).send("Unable to find organization for this user.");
        return;
    }

    for (let i = 0; i < array.length; i++) {
        console.log("creating this donation", {
            ...array[i],
            organization: {
                _id: organizationInfo._id,
                name: organizationInfo.organizationName,
            },
        });
        let result = await new Donation({
            ...array[i],
            organization: {
                _id: organizationInfo._id,
                name: organizationInfo.organizationName,
            },
        }).save();
        results.push(result);
    }
    res.json(results);
};

export const createDonation = async (req, res) => {
    const result = await new Donation(req.body).save();
    res.json(result);
};

export const setRemark = async (req, res, next) => {
    req.body.remark = "this is a middleware-generated remark";
    next();
};

export const updateDonation = async (req, res) => {
    const { id } = req.params;

    const result = await Donation.findOneAndUpdate(
        {
            _id: id,
        },
        req.body,
        {
            new: true,
            runValidators: true,
        }
    );

    res.json(result);
};

export const deleteDonation = async (req, res) => {
    const { id } = req.params;
    await Donation.deleteOne({
        _id: id,
    });
    res.send("Successfully delete donation");
};

export const deleteAllDonations = async (req, res) => {
    await Donation.deleteMany({});
    res.send("Successfully deleted all donations");
};

export const createPdfTest = async (req, res) => {
    const pdfData = await getTaxReceiptData(req);
    res.json(pdfData);
};

export const createPdf = async (req, res) => {
    const pdfData = await getTaxReceiptData(req);

    try {
        const receiptPdf = getTaxReceiptPdf(pdfData);

        let donationReceiptsFilename = `donation-receipts-${moment().format(
            "YYYYMMDD"
        )}`;
        donationReceiptsFilename =
            encodeURIComponent(donationReceiptsFilename) + ".pdf";

        res.setHeader(
            "Content-disposition",
            'inline; filename="' + donationReceiptsFilename + '"'
        );
        res.setHeader("Content-type", "application/pdf");

        receiptPdf.pipe(res);
        receiptPdf.end();
        console.log("hello");
    } catch (e) {
        console.log("error happened in pdf generation", e.message);
    }
};

export const testPdf = async (req, res) => {
    res.send("Hello world this is /testPdf");
};

const getTaxReceiptPdf = (pdfData) => {
    const doc = new PDFDocument();

    pdfData.forEach((donation, index) => {
        if (index > 0) {
            doc.addPage();
        }

        const receiptsPerPage =
            donation.organizationName.search(/church/i) >= 0 ? 2 : 1;

        for (let i = 1; i <= receiptsPerPage; i++) {
            generateReceiptPdf(doc, donation, i);
        }
    });

    generateEnvelopePdf(doc, pdfData);

    return doc;
};

///////
const mongoose = require("mongoose");
const Donation = mongoose.model("Donation");

const Organization = mongoose.model("Organization");
const _ = require("lodash");
const PDFDocument = require("pdfkit");
const moment = require("moment");
const { getFirstAndLastDaysOfLastMonth } = require("../../utilities/helpers");

const {
    getSearchConditions,
    getTaxReceiptData,
    generateEnvelopePdf,
    generateReceiptPdf, 
    sortDonors
} = require("./utils");

exports.getDashboardStats = async (req, res) => {
  let organizationIDs = req.decoded.organizations;
  organizationIDs = organizationIDs.map(
    (id) => new mongoose.Types.ObjectId(id)
  );

  // get first and last dates of previous month
  // console.log('res.locals.h', res.locals.h)
  // console.log('getFirstAndLastDaysOfLastMonth', getFirstAndLastDaysOfLastMonth)
  const { startDate, endDate } = getFirstAndLastDaysOfLastMonth();
  console.log(
    moment(startDate, "YYYYMMDD").toISOString(),
    moment(endDate, "YYYYMMDD").toISOString()
  );
  // get all donations for the previous month
  // group by organization and currency
  // sum the amount
  const stats = await Donation.aggregate([
    {
      $match: {
        "folder.date": {
          $gte: moment(startDate, "YYYYMMDD").toDate(),
          $lte: moment(endDate, "YYYYMMDD").toDate(),
        },
        "organization._id": {
          $in: organizationIDs,
        },
      },
    },
    {
      $sort: {
        "organization.name": 1,
        currency: -1,
      },
    },
    {
      $group: {
        _id: {
          //date: '$folder.date',
          organization: "$organization.name",
          currency: "$currency",
        },

        total: {
          $sum: "$amount",
        },
      },
    },
  ]);

  res.json(stats);
};

exports.getDonations = async (req, res) => {
  const searchParams = getSearchConditions(req);
  const donations = await Donation
    .find(searchParams)
    .populate({
      path: "donor"
    })
    // .sort('donor.firstName')

  //console.log('req.params', req.query)
  res.json(donations.sort((donation1, donation2) => {
    const {donor: donor1} = donation1;
    const {donor: donor2} = donation2;
    return sortDonors(donor1, donor2);
  }))
};



exports.createDonations = async (req, res) => {
  const array = req.body;
  let results = [];

  // Get the organization ID and name of the user.
  const [organization] = req.decoded.organizations;
  if (!organization) {
    res.send(500, "Unable to find organization for this user.");
    return;
  }

  const organizationInfo = await Organization.findOne({
    _id: organization,
  });
  if (!organizationInfo) {
    res.send(500, "Unable to find organization for this user.");
    return;
  }

  for (let i = 0; i < array.length; i++) {
    console.log("creating this donation", {
      ...array[i],
      organization: {
        _id: organizationInfo._id,
        name: organizationInfo.organizationName,
      },
    });
    let result = await new Donation({
      ...array[i],
      organization: {
        _id: organizationInfo._id,
        name: organizationInfo.organizationName,
      },
    }).save();
    results.push(result);
  }
  res.json(results);
};
exports.createDonation = async (req, res) => {
  //const { donor, organization, folder, type, remark, amount, currency, date } = req.body;
  const result = await new Donation(req.body).save();
  res.json(result);
};
// a test middleware that just sets the remark to "this is a middleware-generated remark"
exports.setRemark = async (req, res, next) => {
  req.body.remark = "this is a middleware-generated remark";
  next();
};
exports.updateDonation = async (req, res) => {
  const { id } = req.params;

  let result;
  result = await Donation.findOneAndUpdate(
    {
      _id: req.params.id,
    },
    req.body,
    {
      new: true, // return document after update is made
      runValidators: true,
    }
  );

  res.json(result);
};
exports.deleteDonation = async (req, res) => {
  const { id } = req.params;
  const result = await Donation.deleteOne({
    _id: id,
  });
  res.send("Successfully delete donation");
};
exports.deleteAllDonations = async (req, res) => {
  const result = await Donation.deleteMany({});

  res.send("Successfully deleted all donations");
};


exports.createPdfTest = async (req, res) => {
  const pdfData = await getTaxReceiptData(req);

  res.json(pdfData);
};
exports.createPdf = async (req, res) => {
  const pdfData = await getTaxReceiptData(req);

  try {
    // create a pdf of all the tax receipts
    const receiptPdf = getTaxReceiptPdf(pdfData);

    // Stripping special characters
    let donationReceiptsFilename = `donation-receipts-${moment().format(
      "YYYYMMDD"
    )}`;
    donationReceiptsFilename =
      encodeURIComponent(donationReceiptsFilename) + ".pdf";

    res.setHeader(
      "Content-disposition",
      'inline; filename="' + donationReceiptsFilename + '"'
    );
    res.setHeader("Content-type", "application/pdf");

    receiptPdf.pipe(res);
    receiptPdf.end();
    console.log("hello");
  } catch (e) {
    console.log("error happened in pdf generation", e.message);
  }
};



exports.testPdf = async (req, res) => {
  res.send("Hello world this is /testPdf");
  return;
};

// return a pdfkit instance with all the necessary information inside of it
const getTaxReceiptPdf = (pdfData) => {
  const doc = new PDFDocument();

  // Print tax receipts onto each page.
  pdfData.forEach((donation, index) => {
    if (index > 0) {
      doc.addPage();
    }

    // If church donation, then 2 receipts per page;
    // for LLH donation, only 1 receipt per page.
    const receiptsPerPage =
      donation.organizationName.search(/church/i) >= 0 ? 2 : 1;

    for (let i = 1; i <= receiptsPerPage; i++) {
      generateReceiptPdf(doc, donation, i);
    }
  });

  // add pages to the pdf for envelopes (which will be given to anyone who made a church donation)
  generateEnvelopePdf(doc, pdfData);

  return doc;
};

