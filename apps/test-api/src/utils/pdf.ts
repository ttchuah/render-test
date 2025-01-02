import _ from "lodash";
import mongoose from "mongoose";
import moment from "moment";
import { asyncForEach } from "./asyncForEach";

import {Organization} from "../features/organization/organizationModel";
import {Donor} from "../features/donor/donorModel";
import {Donation, IDonation} from "../features/donation/donationModel";
import {Request, Response} from "express";
import { llh, church } from "../constants";

interface SearchParams {
    "organization._id"?: mongoose.Types.ObjectId | { $in: mongoose.Types.ObjectId[] };
    donor?: mongoose.Types.ObjectId;
    "folder.date"?: { $gte?: Date; $lte?: Date };
    "folder._id"?: mongoose.Types.ObjectId;
}

interface IQuery {
    startDate?: string;
    endDate?: string;
    donor?: string;
    folder?: string;
}
const getSearchConditions = (req: Request<{}, {}, {}, IQuery>, res: Response): SearchParams => {
    const [organization] = req.decoded.organizations;
    if (!organization) {
        res.json([]);
        return {};
    }

    const { startDate, endDate, donor, folder } = req.query;
    const searchParams: SearchParams = {};

    if (!_.isNil(organization)) {
        searchParams["organization._id"] = new mongoose.Types.ObjectId(organization);
    } else {
        const organizations = _.get(req, "decoded.organizations", null);
        if (!_.isNil(organizations) && Array.isArray(organizations)) {
            searchParams["organization._id"] = {
                $in: organizations.map(
                    (organizationID) => new mongoose.Types.ObjectId(organizationID)
                ),
            };
        }
    }

    if (!_.isNil(donor)) {
        searchParams["donor"] = new mongoose.Types.ObjectId(donor);
    }
    if (!_.isNil(startDate)) {
        searchParams["folder.date"] = {
            $gte: moment(startDate, "YYYYMMDD").toDate(),
        };
    }
    if (!_.isNil(endDate)) {
        searchParams["folder.date"] = {
            ...searchParams["folder.date"],
            $lte: moment(endDate, "YYYYMMDD").toDate(),
        };
    }
    if (!_.isNil(folder)) {
        searchParams["folder._id"] = new mongoose.Types.ObjectId(folder);
    }
    return searchParams;
};

const getPDFData = async (searchParams) => {
  // Get the Date Issued for the tax receipt.
  // Default it to the end date of the search date range.
  // If end date is unspecified, then set it to today's date.


  const dateIssued = _.get(searchParams, ["folder.date", "$lte"], new Date());

  let donors = await Donor.find({});

  let donorData = await Donation.aggregate([
    {
      $match: {
        ...searchParams,
      },
    },
    {
      $project: {
        "organization.name": 1,
        donationYear: {
          $year: "$folder.date",
        },
        donor: 1,
        amount: 1,
        currency: 1,
      },
    },
    {
      $group: {
        _id: {
          organization: "$organization.name",
          donor: "$donor",
          currency: "$currency",
          donationYear: "$donationYear",
        },
        sum: {
          $sum: "$amount",
        },
      },
    },
    {
      $group: {
        _id: {
          donor: "$_id.donor",
          organization: "$_id.organization",
          donationYear: "$_id.donationYear",
        },
        donations: {
          $push: {
            $arrayToObject: [[{ k: "$_id.currency", v: "$sum" }]],
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        donor: "$_id.donor",
        organizationName: "$_id.organization",
        donationYear: "$_id.donationYear",
        donations: 1,
      },
    }
  ]);

  donorData = donorData.map((data) => {
    // the mapped donor
    const donor = donors.find((donor) => {
      return String(donor._id) === String(data.donor);
    });
    const organizationName = _.get(data, "organizationName", "")
    console.log('organizationName', organizationName)
    const donationReceiptProps = (organizationName.search(/church/i) >= 0) ? church : llh

    return {
      firstName: _.get(donor, "firstName", ""),
      lastName: _.get(donor, "lastName", ""),
      address: _.get(donor, "address", ""),
      referenceNumber: _.get(donor, "referenceNumber", ""),
      amounts: _.get(data, "donations", null),
      organizationName: donationReceiptProps.organizationName,
      receiptNumber: Math.floor(Math.random() * 100000000000),
      dateIssued: moment(dateIssued).format("MM/DD/YYYY"),
      donationYear: _.get(data, "donationYear"),
      registrationNumber: donationReceiptProps.registrationNumber,
      signatureImageFile: donationReceiptProps.signatureImageFile
      // registrationNumber: "87321 7004 RR0001",
      // signatureImageFile: {
      //   file: "public/images/cog-signature.png",
      //   height: 20,
      //   width: 77,
      // },
      
    };
  }).sort(sortDonors);

  return donorData;
};

const sortDonors = (donor1, donor2) => {
  // If donor1 has ref # but donor2 does not, then donor1 comes first.
  // If vice versa, then donor2 comes first.
  // If both have ref #, then small ref number comes first.
  // If neither has a ref #, then sort alphabetically by first and last name.
  if (donor1.referenceNunber && !donor2.referenceNumber) {
    return -1
  }
  else if (!donor1.referenceNumber && donor2.referenceNumber) {
    return 1
  }
  else if (donor1.referenceNumber && donor2.referenceNumber) {
    if (donor1.referenceNumber < donor2.referenceNumber) return -1
    else if (donor1.referenceNumber > donor2.referenceNumber) return 1
    else return 0
  }
  else {
    if (donor1.firstName < donor2.firstName) return -1;
    else if (donor1.firstName > donor2.firstName) return 1
    else if (donor1.lastName < donor2.lastName) return -1;
    else if (donor1.lastName > donor2.lastName) return 1;
    else return 0;
  }
}

const getLLHPDFData = async (searchParams) => {
  const llhData: IDonation = await Donation.find(
    {
      ...searchParams,
    },
    {
      "organization.name": 1,
      donor: 1,
      "folder.date": 1,
      amount: 1,
      currency: 1,
    }
  ).populate("donor");

  const pdfData = [];
  llhData.forEach((donation) => {
    const { firstName, lastName, referenceNumber, address } = donation.donor;
    const { amount, currency } = donation;
    const { date: folderDate } = donation.folder;
    const { name: organizationName } = donation.organization;
    const registrationNumber = "87061 7727 RR0001"; // light and love home reg #
    const donationYear = moment(folderDate).year();
    const receiptNumber = Math.floor(Math.random() * 100000000000);
    const dateIssued = moment().format("MM/DD/YYYY");
    const signatureImageFile = {
      file: "public/images/llh-signature.png",
      height: 20,
      width: 50,
    };
    pdfData.push({
      firstName,
      lastName,
      address,
      referenceNumber,
      amounts: [
        {
          [currency]: amount,
        },
      ],
      organizationName,
      registrationNumber,
      receiptNumber,
      dateIssued,
      donationYear,
      signatureImageFile,
    });
  });
  // console.log('final data from getLLHPDFData', pdfData)
  return pdfData;
};

const getTaxReceiptDataByOrg = async (org, searchParams) => {
    if (!["llh","church"].includes(org.type)) return []
    const data = await getPDFData({
        ...searchParams,
        "organization._id": org._id,
    });
    return data; 
//   if (org.type === "llh") {
//     const data = await getLLHPDFData({
//       ...searchParams,
//       "organization._id": org._id,
//     });
//     return data;
//   } else if (org.type === "church") {
//     const data = await getChurchPDFData({
//       ...searchParams,
//       "organization._id": org._id,
//     });
//     return data;
//   } else {
//     return [];
//   }
};

const getTaxReceiptData = async (req, res) => {
  // // search for the results
  const searchParams = getSearchConditions(req, res);

  // const donations = await Donation.find(searchParams).populate('donor')

  // group by donor and then sum up per currency type
  console.log("searchParams", searchParams);
  let pdfData = [];
  // let llhPdfData = []
  // let churchPdfData = []

  if (_.has(searchParams, "organization._id")) {
    console.log("filtering on an org id");

    // find out whether it's for the church or llh
    const orgID = searchParams["organization._id"];

    // find the type of org being searched for
    const orgs = await Organization.find({ _id: orgID }, "type");

    console.log("orgs", orgs);
    const loop = async () => {
      await asyncForEach(orgs, async (org) => {
        const data = await getTaxReceiptDataByOrg(org, searchParams);
        pdfData = pdfData.concat(data);
      });
    };
    await loop();
    // console.log('org', org)
    // const data = await getTaxReceiptDataByOrg(org, searchParams)
    // pdfData = pdfData.concat(data)
  } else {
    // get all the orgs, then get the donation data for each org
    const orgs = await Organization.find({});

    const loop = async () => {
      await asyncForEach(orgs, async (org) => {
        const data = await getTaxReceiptDataByOrg(org, searchParams);
        pdfData = pdfData.concat(data);
      });
    };
    await loop();
  }
  //console.log("final pdfData", pdfData);
  return pdfData;
};

const generateEnvelopePdf = async (doc, pdfData) => {
  pdfData
    .filter((receipt) => receipt.organizationName.search(/church/i) >= 0)
    .forEach((receipt) => {
      const { receiptNumber, organizationName, dateIssued, referenceNumber } =
        receipt;

      doc.addPage({
        layout: "landscape",
        size: [340, 780],
      });

      doc.fontSize(10).font("Times-Roman");
      doc.text(organizationName, 50, 30);

      doc.text("1331 S.E. Marine Drive, Vancouver, BC, V5X4L1");
      doc.text("Tel: 604 709 8008 Fax: 604 709 8007");

      doc.font("Times-Bold");
      doc.text(dateIssued, 500, 30, {
        align: "right",
      });

      doc.text(receiptNumber, {
        align: "right",
      });

      doc.fontSize(14);
      doc.text(referenceNumber, 110, 130, {
        align: "center",
      });

      doc.fontSize(16).font("Helvetica");

      doc.text(
        "Please return this envelope to the Offering Box after writing down",
        75,
        180,
        {
          align: "center",
        }
      );
      doc.text("your name and address on the back of this envelope", {
        align: "center",
      });

      // instructions in Chinese
      doc.font("public/fonts/msyh.ttf");
      doc.fontSize(15);
      doc.text(
        "請於此信封背面，寫下你的姓名及地址，然後投入奉獻箱內。",
        190,
        225
      );
    });
  return doc;
};

// Write the tax receipt(s) onto the pdf.
/**
 *
 * @param {*} doc - PDFDocument object
 * @param {*} donationInfo - Donation info object
 */
const generateReceiptPdf = (doc, donationInfo, copyIndex) => {
  let offset = 0;

  let bottomRightText = "Copy 1: Income Tax Purpose";

  if (copyIndex > 1) {
    offset = 360;
    bottomRightText = "Copy 2: Accounting";
  }

  const {
    firstName,
    lastName,
    address,
    referenceNumber,
    amounts,
    organizationName,
    registrationNumber,
    receiptNumber,
    dateIssued,
    donationYear,
    signatureImageFile,
  } = donationInfo;
  // console.log("donationInfo", donationInfo);

  // generate two tax receipts for each donation.
  // the first one will have "Copy 1: Income Tax Purpose" on the bottom right
  // the second one will have "Copy 2: Accounting" on the bottom right

  doc.fontSize(10).font("Times-Roman");

  //////////////////////////// text ////////////////////////////
  doc.font("Times-Bold");
  doc.text(
    "Official Donation Receipt For Income Tax Purposes",
    50,
    30 + offset
  );
  doc.font("Times-Roman");
  doc.text(`Receipt no ${receiptNumber}`, 400, 30 + offset); // fill
  doc.font("Times-Bold");
  doc.fontSize(11).text(`${organizationName}`, 30, 60 + offset); // fill
  doc.fontSize(10).text("1331 S.E. Marine Drive", 200, 60 + offset);
  doc.text("Vancouver, B.C.,", 200, 70 + offset);
  doc.text("V5X 4L1", 200, 80 + offset);

  doc.text("Charity BN / Registration #", 350, 60 + offset);
  doc.text(`${registrationNumber}`, 470, 60 + offset, { lineBreak: false }); // fill

  doc.font("Times-Roman");
  doc.text("Donation received during", 30, 105 + offset);
  doc.text(`${donationYear}`, 150, 105 + offset); // fill

  doc.text("Donation by", 210, 105 + offset);

  // enter the names using a Chinese font
  doc.font("public/fonts/msyh.ttf").fontSize(9);

  doc.text(firstName, 275, 103 + offset); // fill
  doc.text(lastName, 380, 103 + offset); // fill

  doc.font("Times-Roman").fontSize(7);
  doc.text("First name", 275, 117 + offset);
  doc.text("Last name", 380, 117 + offset);

  doc.fontSize(10);
  doc.text("Reference number", 210, 135 + offset);
  doc.text(referenceNumber, 325, 135 + offset); // fill
  doc.text("Address", 210, 165 + offset);
  doc.text(address, 255, 165 + offset);

  doc.font("Times-Bold");
  doc.text("Eligible amount of gift for tax purposes", 30, 195 + offset);
  amounts.forEach((donation, index) => {
    const currency = _.keys(donation)[0];
    const amount = donation[currency];
    //_.keys(donation)[0]
    doc.text(`${currency}: ${amount}`, 215 + index * 100, 195 + offset); // fill
  });

  doc.font("Times-Roman");
  //doc.text("(No goods or services in consideration, in whole or in part in connection with gift.)", 165, 210)

  doc.text("Date receipt issued", 300, 240 + offset);
  doc.text(dateIssued, 400, 240 + offset); // fill
  doc.text("Location receipt issued", 300, 270 + offset);
  doc.text("Vancouver, B.C.", 400, 270 + offset);
  doc.text("Authorized signature", 300, 300 + offset);
  doc.image(signatureImageFile.file, 400, 290 + offset, {
    width: signatureImageFile.width,
    height: signatureImageFile.height,
  });

  doc.text(
    "For information on all registered charities in Canada under the Income Tax Act please visit:",
    120,
    325 + offset
  );
  doc.text("Canada Revenue Agency www.cra.gc.ca/charities", 200, 335 + offset);

  doc.fontSize(8);
  doc.text(bottomRightText, 475, 335 + offset, { lineBreak: false });

  //////////////////////////// lines ////////////////////////////

  // border
  doc
    .save()
    .moveTo(25, 25 + offset)
    .lineTo(590, 25 + offset)
    .lineTo(590, 345 + offset)
    .lineTo(25, 345 + offset)
    .lineTo(25, 25 + offset)
    .stroke();

  // donations received during
  doc
    .save()
    .moveTo(140, 115 + offset)
    .lineTo(190, 115 + offset)
    .stroke();

  // donation by
  doc
    .save()
    .moveTo(270, 115 + offset)
    .lineTo(580, 115 + offset)
    .stroke();

  // social insurance no
  doc
    .save()
    .moveTo(320, 145 + offset)
    .lineTo(580, 145 + offset)
    .stroke();

  // address
  doc
    .save()
    .moveTo(250, 175 + offset)
    .lineTo(580, 175 + offset)
    .stroke();

  // eligible amount of gift for tax purposes
  doc
    .save()
    .moveTo(210, 205 + offset)
    .lineTo(580, 205 + offset)
    .stroke();

  // Date receipt issued
  doc
    .save()
    .moveTo(390, 250 + offset)
    .lineTo(580, 250 + offset)
    .stroke();

  // location receipt issued
  doc
    .save()
    .moveTo(400, 280 + offset)
    .lineTo(580, 280 + offset)
    .stroke();

  // authorized signature
  doc
    .save()
    .moveTo(395, 310 + offset)
    .lineTo(580, 310 + offset)
    .stroke();

  //doc.addPage();

  //console.log('donation', donation)
  //})
  return doc;
};

module.exports = {
    getSearchConditions,
    getTaxReceiptData,
    generateEnvelopePdf,
    generateReceiptPdf,
    sortDonors
}