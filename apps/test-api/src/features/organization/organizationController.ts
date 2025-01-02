const _ = require('lodash');
import _ from "lodash";
import mongoose from "mongoose";
import Organization from "./organizationModel";
import {Request, Response} from "express";
const Donation = mongoose.model('Donation');


export const getOrganizations = async (req: Request, res: Response): Promise<void> => {

    // could be a comma-separated list of ids
    const ids = _.get(req, 'query.id', null)

    let organizationIDs = req.decoded.organizations

    // console.log('getOrganizations')
    // console.log('req.decoded', req.decoded)

    if (_.isEmpty(organizationIDs) || _.isNil(organizationIDs)) {
        //console.log('no ids')
        const organizations = await Organization.find({})
        res.json(organizations);
    } else {
        organizationIDs = organizationIDs.map((id) => new mongoose.Types.ObjectId(id))
        console.log('organizationIDs', organizationIDs)
        const organizations = await Organization.find({
            '_id': {
                $in: organizationIDs
            }
        });
        res.json(organizations);
    }
}
export const saveOrganization = async (req, res) => {
    const { organizationName } = req.body;

    const results = await Organization.find({
        organizationName
    })
    if (!_.isEmpty(results)) {
        res.status(401).send("This organization name is already taken.")
    } else {
        const organization = await (new Organization({
            organizationName
        })).save()

        res.json(organization)
    }
}
export const updateOrganization = async (req, res) => {
    const updatedOrganization = await Organization.findOneAndUpdate({ _id: req.params.id }, {
        organizationName: req.body.organizationName
    }, {
        new: true,
        runValidators: true
    })

    // update the affected donations too
    const updatedDonations = await Donation.updateMany(
        { 'organization._id': req.params.id },
        { $set: { 'organization.name': req.body.organizationName } }
    )

    //res.send(updatedOrganization);
    res.json({
        updatedOrganization,
        updatedDonations
    })
}
export const deleteOrganization = async (req, res) => {
    const donations = await Donation.find({
        'organization._id': req.params.id
    })
    if (!_.isEmpty(donations)) {
        res.status(403).send("This organization is attached to donations. Cannot delete.")
    }
    const result = await Organization.deleteMany({
        _id: req.params.id
    })
    res.send(`Successfully delete ${result.deletedCount} organization(s).`)
}

export const deleteAllOrganizations = async (req, res) => {
    const donations = await Donation.find({
        'organization._id': {
            $ne: null
        }
    })

    if (!_.isEmpty(donations)) {
        res.status(403).send('You can\'t just delete all the organizations. Some organizations are linked to donations. Just delete the selected organizations that you no longer need.')
    }

    console.log('donations', donations)

    // const results = await Organization.deleteMany({})
    // res.send("Successfully deleted all organizations")
}