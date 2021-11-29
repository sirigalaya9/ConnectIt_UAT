import { LightningElement, api, wire, track } from "lwc";
import { getObjectInfo } from "lightning/uiObjectInfoApi";
import { getRecord, getFieldValue, createRecord } from "lightning/uiRecordApi";
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { getPicklistValues } from 'lightning/uiObjectInfoApi';
import { NavigationMixin } from 'lightning/navigation';
import { encodeDefaultFieldValues } from 'lightning/pageReferenceUtils';
import { getRecordCreateDefaults } from 'lightning/uiRecordApi';


import OPPORTUNITY_OBJECT from "@salesforce/schema/Opportunity";
import SITE_SCHEME_OBJECT from "@salesforce/schema/Site_Scheme__c";
import SITE from "@salesforce/schema/Opportunity.Site__c";
import SITE_NAME from "@salesforce/schema/Opportunity.Site__r.Name";
import PROJECT from "@salesforce/schema/Opportunity.Project__c";
import ClOSEDATE from "@salesforce/schema/Opportunity.CloseDate";
import TYPE from "@salesforce/schema/Opportunity.Type";
import PROPERTYTYPE from "@salesforce/schema/Opportunity.Property_Type__c";
import UTILITIES from "@salesforce/schema/Opportunity.Utilities__c";
import CONTACTNAME from "@salesforce/schema/Opportunity.Contact_Name__c";
import CREATEDDATE from "@salesforce/schema/Opportunity.CreatedDate";
import MATERIALUPLIFT from "@salesforce/schema/Opportunity.Materials_Uplift__c";
import MANAGEMENTUPLIFT from "@salesforce/schema/Opportunity.Management_Uplift__c";


import userId from "@salesforce/user/Id";

import searchProduct from "@salesforce/apex/NewQuoteEstimateController.searchProduct";
import getInitialLineItems from "@salesforce/apex/NewQuoteEstimateController.getInitialLineItems";
import query from '@salesforce/apex/NewQuoteEstimateController.query';
import saveUtilityProducts from '@salesforce/apex/NewQuoteEstimateController.saveUtilityProducts';
import createEstimate from '@salesforce/apex/NewQuoteEstimateController.createEstimate';
import getrelatedRules from "@salesforce/apex/NewQuoteEstimateController.getrelatedRules";
import getCoreProductsByRules from "@salesforce/apex/NewQuoteEstimateController.getCoreProductsByRules";
import getExistingScheme from "@salesforce/apex/NewQuoteEstimateController.getExistingScheme";


import TOTALKITSELL from "@salesforce/schema/Opportunity.Total_Kit_Sell__c";
import TOTALLABOURSELL from "@salesforce/schema/Opportunity.Total_Labour_Sell__c";
import TOTALMATERIALSELL from "@salesforce/schema/Opportunity.Total_Material_Sell__c";
import TOTALPLANTSELL from "@salesforce/schema/Opportunity.Total_Plant_Sell__c";
import MARGIN from "@salesforce/schema/Opportunity.Margin_New__c";

import RECORDTYPEID from "@salesforce/schema/Opportunity.RecordTypeId";
import RECORDTYPENAME from "@salesforce/schema/Opportunity.RecordType.Name";
import PRICEBOOK2ID from '@salesforce/schema/Opportunity.Pricebook2Id';

const _FIELDS = [
    RECORDTYPEID, RECORDTYPENAME, SITE, PROJECT, ClOSEDATE, TYPE, PROPERTYTYPE, UTILITIES,
    TOTALKITSELL, TOTALLABOURSELL, TOTALMATERIALSELL, TOTALPLANTSELL, MARGIN,
    PRICEBOOK2ID, SITE_NAME, CONTACTNAME, CREATEDDATE, MATERIALUPLIFT, MANAGEMENTUPLIFT
];

const columns = [
    { label: 'Rule Name', fieldName: 'Name', type: 'text' },
    { label: 'Description', fieldName: 'Description__c', type: 'text' },
    { label: 'Rule Type', fieldName: 'Rule_Type__c', type: 'text' }
];

/*cellAttributes: { class: 'slds-text-color_success slds-text-title_caps'}*/


export default class NewQuoteEstimate extends NavigationMixin(LightningElement) {
    @api recordId;

    @track selectedOption;
    @track options;
    @track opp_RT_Name;
    @track opp_Project;
    @track opp_Site;
    @track opp_Id;
    @track site_name;
    @track user_name;
    @track user_title;
    @track user_phone;
    @track user_email;
    @track createddate;
    @track closedate;
    @track contact_name;
    @track currentStep = '1';
    @track firstPage = true;
    @track lastPage = false;
    @track preDisabled = true;
    @track nextDisabled = false;
    @track siteSchemeInfo;
    @track selectedUtilityList = [];
    @track schemeItems = [];

    @track _utilityItems = [];
    @track TotalKitSell = 0;
    @track TotalLabourSell = 0;
    @track TotalMaterialSell = 0;
    @track TotalPlantSell = 0;
    @track TotalTrafficManagement = 0;
    @track TotalEstimationAmount = 0;
    @track TotalNoncontestableCosts = 0;
    @track SellPlusManagement = 0;
    @track TotalAssetValue = 0;
    @track Margin = 0;
    @track saveDisabled = false;
    @track data; // = data;
    @track columns = columns;
    @track noOfAvailableRules = 0;
    @track noOfSeletcedRules = 0;
    @track selectedRows = [];


    _selected = [];
    showSpinner = false;
    closeWindow = false;
    activeSectionMessage = '';
    removedItems = [];
    productIdSet = [];
    showDeleteProductModal = false;
    showSelectRuleModal = false;
    productToDeleteId;
    productToDeleteIndex;
    productToDeleteParentIndex;
    currentAddedIndex;
    currentAddedNewIndex;
    rtis;
    pdfBase64Data = '';
    blob;
    _quoteId;
    _contentVersionId;
    _contentDocumentId;
    ProductFamilyScheme;
    NumberofPlots;
    rule_eletric;
    newSelectedRules = [];
    selectedRuleUtilityType;
    selectedRuleParentIndex;
    showSelectUtilityTypeModal = false;
    currentRuleUtility;
    deletetype;
    materialUpLift;
    managementUpLift;

    /*userData;
    getUserInfo() {
        console.log("UserInfo");
        console.log("userId " + userId);
        query({
            q:
                "SELECT Id, Name, Title, MobilePhone, Email, Phone FROM User WHERE Id ='" +
                userId +
                "'"
        }).then((result) => {
            if (result && result.length !== 0) {
                //this.userProfileName = result[0].Profile.Name;
                console.log(result[0]);
                this.user_name = result[0].Name;
                this.user_title = result[0].Title;
                this.user_phone = result[0].Phone;
                this.user_email = result[0].Email;
            }
        });
    }*/


    @wire(getObjectInfo, { objectApiName: SITE_SCHEME_OBJECT })
    ObjectInfo(result, error) {
        if (result.data) {
            //console.log(JSON.stringify(result.data));
            this.siteSchemeInfo = result;
            if (result.data.recordTypeInfos) {
                this.rtis = this.siteSchemeInfo.data.recordTypeInfos;
                console.log("recordTypeInfos");
            }
        }
        if (error) {
            console.error(error);
        }

    }

    opportunity;
    @wire(getRecord, { recordId: "$recordId", fields: _FIELDS })
    getRecord(result) {
        console.log(this.recordId);
        console.log("getRecord");
        let selectedUtility = '';
        if (result.data) {
            this.opportunity = result;
            this.opp_Id = this.recordId;
            this.opp_RT_Name = this.opportunity.data.recordTypeInfo.name;
            this.opp_Project = this.opportunity.data.fields.Project__c.value;
            this.opp_Site = this.opportunity.data.fields.Site__c.value;
            this.site_name = this.opportunity.data.fields.Site__r.value.fields.Name.value;
            this.contact_name = this.opportunity.data.fields.Contact_Name__c.value;
            this.createddate = this.opportunity.data.fields.CreatedDate.value;
            this.closedate = this.opportunity.data.fields.CloseDate.value;
            if (typeof this.opportunity.data.fields.Materials_Uplift__c.value != 'undefined' || 
                this.opportunity.data.fields.Materials_Uplift__c.value != '' || 
                this.opportunity.data.fields.Materials_Uplift__c.value != null)

                this.materialUpLift = this.opportunity.data.fields.Materials_Uplift__c.value;
            else
                this.materialUpLift = 0;

            if (typeof this.opportunity.data.fields.Management_Uplift__c.value != 'undefined' || 
                this.opportunity.data.fields.Management_Uplift__c.value != '' || 
                this.opportunity.data.fields.Management_Uplift__c.value != null)
                
                this.managementUpLift = this.opportunity.data.fields.Management_Uplift__c.value;
            else
                this.managementUpLift = 0;


            selectedUtility = this.opportunity.data.fields.Utilities__c.displayValue;
            console.log(selectedUtility);
            this.selectedUtilityList = String(selectedUtility).split(';');
            console.log(this.opportunity);

            //this.defaultOpportunityData();
        }

    }

    connectedCallback() {
        console.log('connectedCallback');
        //this.getUserInfo();
    }


    get utilityItems() {
        console.log('utilityItems');

        return this._utilityItems;
    }

    get contentVersionId() {
        return this._contentVersionId;
    }

    get contentDocumentId() {
        return this._contentDocumentId;
    }

    get quoteId() {
        return this._quoteId;
    }

    initialCreateScheme() {

        if (this.rtis && this.selectedUtilityList.length > 0) {

            getExistingScheme({
                oppId: this.recordId,
                selectedUtilityList: this.selectedUtilityList
            })
                .then(schemes => {
                    let schemeIdMap = new Map();
                    let schemeFieldValuesMap = new Map();
                    for (var key in schemes) {
                        schemeIdMap.set(key, schemes[key].Id);
                        schemeFieldValuesMap.set(key, schemes[key]);
                    }

                    this.schemeItems = [];
                    this.selectedUtilityList.forEach(selectedUtility => {
                        console.log('selectedUtility: ' + selectedUtility);
                        let recordTypeName;
                        if (selectedUtility == 'Street Lighting') recordTypeName = 'StreetLighting';
                        else if (selectedUtility == 'Charge Points') recordTypeName = 'Charger';
                        else recordTypeName = selectedUtility;
                        console.log('recordTypeName: ' + recordTypeName);
                        let count = this.schemeItems.length;
                        console.log('count: ' + count);

                        let utilityItem = {
                            index: count++,
                            recordId: schemeIdMap.get(recordTypeName),
                            isElectric: false,
                            isGas: false,
                            isWater: false,
                            isStreetLightning: false,
                            isCharger: false,
                            isFibre: false,
                            isHV: false,
                            showCommercial: false,
                            showLandlord: false,
                            showSubstation: false,
                            showMasterControl: false,
                            showSubControl: false,
                            showCharger: false,
                            showFeeder: false,
                            numberOfCommercial: 0,
                            numberOfLandlord: 0,
                            numberOfSubstations: 0,
                            totalNumberOfPlots: 0,
                            numberOfMasterControl: 0,
                            numberOfSubControl:0,
                            numberOfCharger: 0,
                            numberOfFeeder: 0,
                            utilityType: selectedUtility,
                            utilityRecordTypeId: Object.keys(this.rtis).find(rti => this.rtis[rti].name === recordTypeName)
                        }

                        if (selectedUtility == 'Electric') {
                            utilityItem.isElectric = true;

                            if (schemeFieldValuesMap.get(recordTypeName)) {
                                utilityItem.totalNumberOfPlots = schemeFieldValuesMap.get(recordTypeName).Total_Number_of_plots__c;

                                if (typeof schemeFieldValuesMap.get(recordTypeName).No_of_Commercial__c != 'undefined' &&
                                    schemeFieldValuesMap.get(recordTypeName).No_of_Commercial__c > 0) {
                                    utilityItem.showCommercial = true;
                                    utilityItem.numberOfCommercial = schemeFieldValuesMap.get(recordTypeName).No_of_Commercial__c;
                                }

                                if (typeof schemeFieldValuesMap.get(recordTypeName).No_of_Landlord__c != 'undefined' &&
                                    schemeFieldValuesMap.get(recordTypeName).No_of_Landlord__c > 0) {
                                    utilityItem.showLandlord = true;
                                    utilityItem.numberOfLandlord = schemeFieldValuesMap.get(recordTypeName).No_of_Landlord__c;
                                }

                                if (schemeFieldValuesMap.get(recordTypeName).POC__c == 'HV') {
                                    utilityItem.isHV = true;
                                    if (typeof schemeFieldValuesMap.get(recordTypeName).Number_of_Substations__c != 'undefined' &&
                                        schemeFieldValuesMap.get(recordTypeName).Number_of_Substations__c > 0) {
                                        utilityItem.showSubstation = true;
                                        utilityItem.numberOfSubstations = schemeFieldValuesMap.get(recordTypeName).Number_of_Substations__c;
                                    }
                                }
                                else if (schemeFieldValuesMap.get(recordTypeName).POC__c == 'LV') {
                                    utilityItem.isLV = true;
                                    utilityItem.showSubstation = false;
                                    utilityItem.numberOfSubstations = schemeFieldValuesMap.get(recordTypeName).Number_of_Substations__c;
                                }


                            }
                        }
                        else if (selectedUtility == 'Water') {
                            utilityItem.isWater = true;

                            if (schemeFieldValuesMap.get(recordTypeName)) {
                                utilityItem.totalNumberOfPlots = schemeFieldValuesMap.get(recordTypeName).Total_Number_of_plots__c;

                                if (typeof schemeFieldValuesMap.get(recordTypeName).No_of_Commercial__c != 'undefined' &&
                                    schemeFieldValuesMap.get(recordTypeName).No_of_Commercial__c > 0) {
                                    utilityItem.showCommercial = true;
                                    utilityItem.numberOfCommercial = schemeFieldValuesMap.get(recordTypeName).No_of_Commercial__c;
                                }

                                if (typeof schemeFieldValuesMap.get(recordTypeName).No_of_Landlord__c != 'undefined' &&
                                    schemeFieldValuesMap.get(recordTypeName).No_of_Landlord__c > 0) {
                                    utilityItem.showLandlord = true;
                                    utilityItem.numberOfLandlord = schemeFieldValuesMap.get(recordTypeName).No_of_Landlord__c;
                                }
                            }
                        }
                        else if (selectedUtility == 'Gas') {
                            utilityItem.isGas = true;

                            if (schemeFieldValuesMap.get(recordTypeName)) {

                                utilityItem.totalNumberOfPlots = schemeFieldValuesMap.get(recordTypeName).Total_Number_of_plots__c;
                                if (typeof schemeFieldValuesMap.get(recordTypeName).No_of_Commercial__c != 'undefined' &&
                                    schemeFieldValuesMap.get(recordTypeName).No_of_Commercial__c > 0) {
                                    utilityItem.showCommercial = true;
                                    utilityItem.numberOfCommercial = schemeFieldValuesMap.get(recordTypeName).No_of_Commercial__c;
                                }

                                if (schemeFieldValuesMap.get(recordTypeName).CSEP__c == 'H/P' ||schemeFieldValuesMap.get(recordTypeName).CSEP__c == 'M/P') {
                                    utilityItem.isHV = true;
                                    if (typeof schemeFieldValuesMap.get(recordTypeName).Number_of_Substations__c != 'undefined' &&
                                        schemeFieldValuesMap.get(recordTypeName).Number_of_Substations__c > 0) {
                                        utilityItem.showSubstation = true;
                                        utilityItem.numberOfSubstations = schemeFieldValuesMap.get(recordTypeName).Number_of_Substations__c;
                                    }
                                }
                                else {
                                    utilityItem.isHV = false;
                                    utilityItem.showSubstation = false;
                                    utilityItem.numberOfSubstations = schemeFieldValuesMap.get(recordTypeName).Number_of_Substations__c;
                                }
                            }

                        }
                        else if (selectedUtility == 'Street Lighting') {
                            utilityItem.isStreetLightning = true;

                            if (schemeFieldValuesMap.get(recordTypeName)) {

                                utilityItem.totalNumberOfPlots = schemeFieldValuesMap.get(recordTypeName).Total_Number_of_plots__c;

                                if (typeof schemeFieldValuesMap.get(recordTypeName).Number_of_Master_Control_Systems__c != 'undefined' &&
                                    schemeFieldValuesMap.get(recordTypeName).Number_of_Master_Control_Systems__c > 0) {
                                    utilityItem.showMasterControl = true;
                                    utilityItem.numberOfMasterControl = schemeFieldValuesMap.get(recordTypeName).Number_of_Master_Control_Systems__c;
                                }

                                if (typeof schemeFieldValuesMap.get(recordTypeName).Number_of_Sub_Control_Systems__c != 'undefined' &&
                                    schemeFieldValuesMap.get(recordTypeName).Number_of_Sub_Control_Systems__c > 0) {
                                    utilityItem.showSubControl = true;
                                    utilityItem.numberOfSubControl = schemeFieldValuesMap.get(recordTypeName).Number_of_Sub_Control_Systems__c;
                                }
                            }

                        }
                        else if (selectedUtility == 'Charge Points') {
                            utilityItem.isCharger = true;

                            if (schemeFieldValuesMap.get(recordTypeName)) {
                                if (schemeFieldValuesMap.get(recordTypeName).POC__c == 'HV') {
                                    utilityItem.isHV = true;
                                    if (typeof schemeFieldValuesMap.get(recordTypeName).Number_of_Substations__c != 'undefined' &&
                                        schemeFieldValuesMap.get(recordTypeName).Number_of_Substations__c > 0) {
                                        utilityItem.showSubstation = true;
                                        utilityItem.numberOfSubstations = schemeFieldValuesMap.get(recordTypeName).Number_of_Substations__c;
                                    }
                                }
                                else if (schemeFieldValuesMap.get(recordTypeName).POC__c == 'LV') {
                                    utilityItem.isLV = true;
                                    utilityItem.showSubstation = false;
                                    utilityItem.numberOfSubstations = schemeFieldValuesMap.get(recordTypeName).Number_of_Substations__c;
                                }

                                if (typeof schemeFieldValuesMap.get(recordTypeName).Charger_Quantity__c != 'undefined' &&
                                    schemeFieldValuesMap.get(recordTypeName).Charger_Quantity__c > 0) {
                                    utilityItem.showCharger = true;
                                    utilityItem.numberOfCharger = schemeFieldValuesMap.get(recordTypeName).Charger_Quantity__c;
                                }

                                if (typeof schemeFieldValuesMap.get(recordTypeName).Feeder_Pillar_Quantity__c != 'undefined' &&
                                    schemeFieldValuesMap.get(recordTypeName).Feeder_Pillar_Quantity__c > 0) {
                                    utilityItem.showFeeder = true;
                                    utilityItem.numberOfFeeder = schemeFieldValuesMap.get(recordTypeName).Feeder_Pillar_Quantity__c;
                                }
                            }

                        }
                        else if (selectedUtility == 'Fibre') utilityItem.isFibre = true;

                        console.log(JSON.stringify(utilityItem));
                        this.schemeItems.push(utilityItem);

                    });
                    console.log(this.schemeItems);

                });

        }

    }


    queryDefaultProducts(isNew) {
        console.log('queryDefaultProducts');
        this.showSpinner = true;
        getInitialLineItems({
            oppId: this.recordId,
            selectedUtilityList: this.selectedUtilityList,
            objectName: 'Site_Scheme__c',
            isNew: isNew
        })
            .then(result => {
                if (result && result.length !== 0) {
                    console.log(result);
                    this._utilityItems = result;

                    let parentIndex = 0;
                    this._utilityItems.forEach(utilityItem => {
                        utilityItem.index = parentIndex++;
                        utilityItem.totalKitSell = 0;
                        utilityItem.totalLabourSell = 0;
                        utilityItem.totalPlantSell = 0;
                        utilityItem.totalClientContribution = 0;
                        utilityItem.noOfAvailableRules = 0;
                        utilityItem.noOfSeletcedRules = 0;
                        if (typeof utilityItem.rules != 'undefined' && utilityItem.rules.length > 0) utilityItem.noOfAvailableRules = utilityItem.rules.length;
                        if (typeof utilityItem.selectedRuleIds != 'undefined' && utilityItem.selectedRuleIds.length > 0) utilityItem.noOfSeletcedRules = utilityItem.selectedRuleIds.length;
                        let index = 0;
                        utilityItem.oppProducts.forEach(oppProduct => {
                            let calMaterialSell = 0;
                            let item = oppProduct.oppLineItem;


                            oppProduct.index = index++;
                            oppProduct.isNew = false;
                            oppProduct.errors = [];
                            oppProduct.selection = {
                                id: item.Product2Id__r.Id,
                                sObjectType: 'Product2',
                                icon: 'standard:product',
                                title: item.Product2Id__r.Name,
                                subtitle: item.Product2Id__r.Name
                            }
                            oppProduct.isRemoveable = true;
                            oppProduct.oppLineItem.Quantity__c = item.Quantity__c;
                            oppProduct.oppLineItem.Implementor__c = item.Implementor__c;
                            if (typeof item.Product2Id__r.Material_Cost__c == 'undefined') item.Product2Id__r.Material_Cost__c = 0;
                            if (this.materialUpLift > 0)
                                calMaterialSell = item.Product2Id__r.Material_Cost__c + (item.Product2Id__r.Material_Cost__c * this.materialUpLift / 100);
                            else
                                calMaterialSell = item.Product2Id__r.Material_Cost__c;

                            oppProduct.oppLineItem.Labour_Sell__c = item.Product2Id__r.Labour_Sell__c;
                            oppProduct.oppLineItem.Plant_Sell__c = item.Product2Id__r.Plant_Sell__c;
                            oppProduct.oppLineItem.Material_Cost__c = item.Material_Cost__c;
                            oppProduct.oppLineItem.Plant_Cost__c = item.Plant_Cost__c;

                            if (item.Id) {
                                oppProduct.productUrl = '/' + item.Id;
                                oppProduct.oppLineItem.Load_Source__c = item.Load_Source__c;
                                oppProduct.oppLineItem.Rule_Name__c = item.Rule_Name__c;
                                oppProduct.oppLineItem.Manipulation_Type__c = item.Manipulation_Type__c;
                                oppProduct.oppLineItem.Multiplier_Field__c = item.Multiplier_Field__c;

                                oppProduct.oppLineItem.Kit_Sell__c = item.Kit_Sell__c;
                                oppProduct.oppLineItem.Total_Sell_Rate_Wizard__c = item.Total_Sell_Rate_Wizard__c;
                                
                            }
                            else {
                                oppProduct.productUrl = '/' + item.Product2Id__r.Id;
                                oppProduct.oppLineItem.Load_Source__c = 'BaseLine';
                                oppProduct.oppLineItem.Kit_Sell__c = parseFloat(calMaterialSell).toFixed(2);
                            }

                            return oppProduct;

                        });

                        this.calculateTotalSell(utilityItem.index);

                        //utilityItem.products.push.apply(utilityItem.products, this.getDefaultProducts(coupledItem.oppProducts));
                    });

                    console.log(this._utilityItems);

                }
                this.showSpinner = false;
            })
            .catch(error => {
                console.log('Error in query: ' + JSON.stringify(error));
                this.showSpinner = false;
            });



    }

    saveUtilityProducts() {
        let utilityProducts = [];
        this.showSpinner = true;
        this._utilityItems.forEach(utilityItem => {
            console.log(utilityItem);
            let utilityProduct = {};

            utilityProduct.oppProducts = [];
            utilityItem.oppProducts.forEach(oppProductItem => {
                console.log(oppProductItem);
                let item = oppProductItem.oppLineItem;
                if (item.Product2Id__r.Id) {
                    let oppProduct = {}
                    oppProduct.oppLineItem = {};

                    if (typeof item.Id != 'undefined') oppProduct.oppLineItem.Id = item.Id;
                    if (typeof item.Kit_Sell__c == 'undefined') item.Kit_Sell__c = 0;
                    if (typeof item.Labour_Sell__c == 'undefined') item.Labour_Sell__c = 0;
                    if (typeof item.Plant_Sell__c == 'undefined') item.Plant_Sell__c = 0;

                    oppProduct.oppLineItem.Quantity__c = parseFloat(item.Quantity__c);
                    oppProduct.oppLineItem.Product2Id__c = item.Product2Id__r.Id;
                    oppProduct.oppLineItem.OpportunityId__c = item.OpportunityId__c;
                    oppProduct.oppLineItem.Plant_Sell__c = parseFloat(item.Plant_Sell__c);
                    oppProduct.oppLineItem.UnitPrice__c = parseFloat(item.Labour_Sell__c);
                    oppProduct.oppLineItem.Material_Sell__c = parseFloat(item.Kit_Sell__c);
                    oppProduct.oppLineItem.Kit_Sell__c = parseFloat(item.Kit_Sell__c) + parseFloat(item.Labour_Sell__c) + parseFloat(item.Plant_Sell__c);
                    //oppProduct.oppLineItem.Material_Cost__c = parseFloat(item.Material_Cost__c);
                    //oppProduct.oppLineItem.Plant_Cost__c = parseFloat(item.Plant_Cost__c);
                    oppProduct.oppLineItem.Implementor__c = item.Implementor__c;
                    oppProduct.oppLineItem.Utility_Type__c = utilityItem.utilityType;
                    oppProduct.oppLineItem.Load_Source__c = item.Load_Source__c;
                    oppProduct.oppLineItem.Rule_Id__c = item.Rule_Id__c;
                    oppProduct.oppLineItem.Rule_Name__c = item.Rule_Name__c;
                    oppProduct.oppLineItem.SchemeItem_Id__c = item.SchemeItem_Id__c;
                    oppProduct.oppLineItem.Manipulation_Type__c = item.Manipulation_Type__c;
                    oppProduct.oppLineItem.Multiplier_Field__c = item.Multiplier_Field__c;

                    oppProduct.oppLineItem.Material_Cost__c = parseFloat(item.Material_Cost__c);
                    oppProduct.oppLineItem.Plant_Cost__c = parseFloat(item.Plant_Cost__c);
                    oppProduct.oppLineItem.Labour_Cost__c = parseFloat(item.Labour_Cost__c);
                    oppProduct.oppLineItem.Total_Sell_Rate_Wizard__c = parseFloat(item.Total_Sell_Rate_Wizard__c);
                    //oppProduct.oppLineItem.Total_Estimation_Amount__c = parseFloat(this.TotalEstimationAmount);
                    


                    /*if (oppProductItem.isNew)
                    {
                        oppProduct.oppLineItem.Product2Id = item.Product2Id;
                        oppProduct.oppLineItem.OpportunityId = item.OpportunityId;
                    }
                    else
                    {
                        oppProduct.oppLineItem.Id = item.Id;
                    }*/

                    utilityProduct.oppProducts.push(oppProduct);
                    console.log(utilityProduct);
                }
            });
            utilityProducts.push(utilityProduct);
            console.log(utilityProducts);

        });

        saveUtilityProducts({
            oppId: this.recordId,
            utilityProducts: utilityProducts,
            deleteLineItems: this.removedItems
        })
            .then(result => {
                //if (result && result.length !== 0) {
                    console.log(result);
                    if(this.deletetype && this.deletetype != null && typeof this.deletetype != 'undefined') 
                        this.deletetype = null;
                    else 
                        this.queryDefaultProducts(true);

                    this.removedItems = [];
                    this.showSpinner = false;
                    this.template.querySelector('c-quote-payment-schedule').resetItems();
                    try {
                        let lookups = this.template.querySelectorAll('c-lookup');
                        for (var i = 0; i < lookups.length; i++) {
                            lookups[i].handleClearSelection();
                        }
                    }
                    catch (e) {
                        console.log(e);
                    }

                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Success',
                            message: "Opportunity Products have been updated",
                            variant: 'Success',
                        }),
                    );

                //}
            })
            .catch(error => {
                console.log('Error in save: ' + JSON.stringify(error));
                let errorMessage = (error && error.body && error.body.pageErrors && error.body.pageErrors[0] && error.body.pageErrors[0].message) || '';
                const event = new ShowToastEvent({
                    title: 'Error',
                    variant: 'error',
                    message: error.body.message,
                });
                this.dispatchEvent(event);
                this.showSpinner = false;
            });

    }

    addNewProduct(event) {

        console.log('addNewProduct');
        let parentIndex = event.target.dataset.parentindex;
        let utilityType = event.target.dataset.utilitytype;
        console.log('utilityType: ' + utilityType);
        console.log('parentIndex: ' + parentIndex);
        console.log(this._utilityItems);

        let product = {};
        let utilityItem = this._utilityItems.find(item => item.index == parentIndex);
        product.index = utilityItem.oppProducts.length;
        product.isNew = true;
        //product.sobjectType = "OpportunityLineItem";
        product.errors = [];
        product.placeholderLabel = "New Product";
        product.isRemoveable = true;

        product.oppLineItem = {};
        product.oppLineItem.OpportunityId__c = this.recordId;
        product.oppLineItem.Product2Id__r = {};
        /*if (utilityType == 'Electric') product.oppLineItem.Product2Id__r.Family = 'Electricity';
        else if (utilityType == 'Charge Points') product.oppLineItem.Product2Id__r.Family = 'Charge Point';
        else product.oppLineItem.Product2Id__r.Family = utilityType;*/
        product.oppLineItem.Quantity__c = 1;
        product.oppLineItem.Kit_Sell__c = 0;
        product.oppLineItem.Material_Sell__c = 0;
        product.oppLineItem.Plant_Sell__c = 0;
        product.oppLineItem.Labour_Sell__c = 0;
        product.oppLineItem.Total_Sell_Rate_Wizard__c = 0;
        product.oppLineItem.Load_Source__c = 'Manual Add';

        product.selection = null;
        product.errors = [];
        product.placeholderLabel = 'Search Product';
        product.isRemoveable = true;

        utilityItem.oppProducts.push(product);

        this.currentAddedNewIndex = product.index;
    }

    handleSearch(event) {
        console.log("handleSearch");
        console.log(event.target.dataset.index);
        let index = event.target.dataset.index;
        let searchTerm = event.detail.searchTerm;
        let utilityType = event.target.dataset.utilitytype;
        console.log('utilityType: ' + utilityType);

        searchProduct({
            searchKeyWord: searchTerm,
            utilityType: utilityType
        })
            .then((results) => {
                console.log(results);
                this.template
                    .querySelector('c-lookup[data-index="' + index + '"][data-utilityType="' + utilityType + '"]')
                    .setSearchResults(results);
            })
            .catch((error) => {
                console.error("Lookup error", JSON.stringify(error));
                this.errors = [error];
            });


    }

    handleProductFamilyChange(event) {
        let utilityType = event.target.dataset.utilitytype;
        //this.ProductFamilyScheme = event.target.value;
        let lookups = this.template.querySelectorAll('c-lookup[data-utilityType="' + utilityType + '"]');
        for (var i = 0; i < lookups.length; i++) {
            console.log(lookups[i]);
            lookups[i].handleClearSelection();
        }
    }

    handleNumberofPlotsChange(event) {
        //this.NumberofPlots = event.target.value;
        let utilityType = event.target.dataset.utilitytype;
        this.ProductFamilyScheme = event.target.value;
        let lookups = this.template.querySelectorAll('c-lookup[data-utilityType="' + utilityType + '"]');
        for (var i = 0; i < lookups.length; i++) {
            console.log(lookups[i]);
            lookups[i].handleClearSelection();
        }
    }

    handleSelectedRule(event) {
        const selectedRows = event.detail.selectedRows;

        let utilityItem = this._utilityItems.find(item => item.utilityType == this.currentRuleUtility);
        let existingRuleIds = [];
        if (typeof utilityItem.selectedRuleIds != 'undefined') existingRuleIds = utilityItem.selectedRuleIds;
        console.log('existingRuleIds : '+existingRuleIds);

        this.newSelectedRules = [];
        this.selectedRows = [];

        selectedRows.forEach(row => {
            this.selectedRows.push(row.ruleSchemeItemId);
            let found = false;
            existingRuleIds.forEach(item => {
                if (row.ruleSchemeItemId == item) {
                    found = true;
                }
            });

            if (found == false) {
                this.newSelectedRules.push(row.ruleSchemeItemId);
            }
        });

        //utilityItem.selectedRuleIds = this.selectedRows;

        console.log(this.selectedRows);
        console.log(this.newSelectedRules);
    }


    get TotalKitSell() {
        return this.TotalKitSell;
    }

    get TotalLabourSell() {
        return this.TotalLabourSell;
    }

    get TotalMaterialSell() {
        return this.TotalMaterialSell;
    }

    get TotalPlantSell() {
        return this.TotalPlantSell;
    }

    get TotalTrafficManagement() {
        return this.TotalTrafficManagement;
    }

    get TotalEstimationAmount() {
        return this.TotalEstimationAmount;
    }


    defaultOpportunityData() {
        const inputFields = this.template.querySelectorAll(
            'lightning-input-field'
        );
        if (inputFields && this.opportunity && this.opportunity.data) {
            inputFields.forEach(field => {
                if (field.fieldName == 'Site__c')
                    field.value = this.opportunity.data.fields.Site__c.value;
                if (field.fieldName == 'Project__c')
                    field.value = this.opportunity.data.fields.Project__c.value;
                if (field.fieldName == 'CloseDate')
                    field.value = this.opportunity.data.fields.CloseDate.value;
                if (field.fieldName == 'Type')
                    field.value = this.opportunity.data.fields.Type.value;
                if (field.fieldName == 'Property_Type__c')
                    field.value = this.opportunity.data.fields.Property_Type__c.value;
                if (field.fieldName == 'Utilities__c')
                    field.value = this.opportunity.data.fields.Utilities__c.value;
                if (field.fieldName == 'Contact_Name__c')
                    field.value = this.opportunity.data.fields.Contact_Name__c.value;

                if (field.fieldName == 'RecordTypeId')
                    field.value = this.opportunity.data.fields.RecordTypeId.value;
            });
        }
    }

    inputChanged(event) {
        console.log('inputChanged');
        let name = event.target.name;
        let value = event.target.value;
        let parentIndex = event.target.dataset.parentindex;
        let index = event.target.dataset.index;
        let utilityType = event.target.dataset.utilitytype;
        let item;
        {
            console.log('name: ' + name);
            console.log('value: ' + value);
            console.log('parentIndex: ' + parentIndex);
            console.log('index: ' + index);
        }

        let utilityItem = this._utilityItems.find(item => item.index == parentIndex);
        let oppProduct = utilityItem.oppProducts.find(item => item.index == index);
        item = oppProduct.oppLineItem;
        console.log(item);
        {
            item[name] = value;
            item.Quantity__c = item.Quantity__c || 0;
            {
                if (name == 'Implementor__c') {
                    item.Implementor__c = item.Implementor__c;
                }
                else if (name == 'Kit_Sell__c') {
                    item.Kit_Sell__c = item.Kit_Sell__c;

                }

            }
        }

        this.calculateTotalSell(parentIndex);
    }

    calculatePlots(event) {
        console.log('calculatePlots');
        let utilityTypePlot = event.target.dataset.utilitytype;
        let fieldName = event.target.fieldName;
        let value = event.target.value;
        console.log(utilityTypePlot);

        let plotFields = this.template.querySelectorAll('lightning-input-field[data-utilityType="' + utilityTypePlot + '"]');
        //console.log(plotFields);

        if (plotFields) {
            var totalNumberOfPlots = 0;
            plotFields.forEach(field => {
                //console.log(field.value);
                if (field.value != null && field.value != "") {
                    totalNumberOfPlots += parseInt(field.value);
                }
            });

            let schemeItem = {};
            if (utilityTypePlot == 'electric-scheme-plot') {
                schemeItem = this.schemeItems.find(item => item.utilityType == 'Electric');
            }
            else if (utilityTypePlot == 'gas-scheme-plot') {
                schemeItem = this.schemeItems.find(item => item.utilityType == 'Gas');
            }
            else if (utilityTypePlot == 'water-scheme-plot') {
                schemeItem = this.schemeItems.find(item => item.utilityType == 'Water');
            }
            else if (utilityTypePlot == 'street-scheme-plot') {
                schemeItem = this.schemeItems.find(item => item.utilityType == 'Street Lighting');
            }

            if (schemeItem) {

                schemeItem.totalNumberOfPlots = totalNumberOfPlots;
                if (fieldName == 'No_of_Commercial__c' && value > 0) {
                    schemeItem.showCommercial = true;
                    schemeItem.numberOfCommercial = value;

                }
                else if (fieldName == 'No_of_Commercial__c' && (value == '' || value == null)) {
                    schemeItem.showCommercial = false;
                    schemeItem.numberOfCommercial = value;
                }


                if (fieldName == 'No_of_Landlord__c' && value > 0) {
                    schemeItem.showLandlord = true;
                    schemeItem.numberOfLandlord = value;
                }
                else if (fieldName == 'No_of_Landlord__c' && (value == '' || value == null)) {
                    schemeItem.showLandlord = false;
                    schemeItem.numberOfLandlord = value;

                }

            }

        }


    }

    pocTypeChange(event) {
        console.log('pocTypeChange');
        let utilityType = event.target.dataset.utilitytype;
        let fieldName = event.target.fieldName;
        let value = event.target.value;

        console.log(fieldName);
        console.log(value);
        console.log(utilityType);

        let schemeItem = this.schemeItems.find(item => item.utilityType == utilityType);

        if (fieldName == 'POC__c') {
            if (value == 'LV') {
                schemeItem.isHV = false;
                schemeItem.showSubstation = false;
            }
            else if (value == 'HV' || value == 'EHV') {
                schemeItem.isHV = true;
                if (schemeItem.numberOfSubstations > 0)
                    schemeItem.showSubstation = true;

            }
        }
        else if (fieldName == 'Number_of_Substations__c') {
            schemeItem.numberOfSubstations = value;
            if (schemeItem.numberOfSubstations > 0)
                schemeItem.showSubstation = true;
            else
                schemeItem.showSubstation = false;
        }
        else if (fieldName == 'CSEP__c') {
            if (value == 'H/P' || value == 'M/P') {
                schemeItem.isHV = true;
                if (schemeItem.numberOfSubstations > 0)
                    schemeItem.showSubstation = true;
            }
            else{
                schemeItem.isHV = false;
                schemeItem.showSubstation = false;
            }
        }
        else if (fieldName == 'Charger_Quantity__c') {
            schemeItem.numberOfCharger = value;
            if (schemeItem.numberOfCharger > 0)
                schemeItem.showCharger = true;
            else
                schemeItem.showCharger = false;
        }
        else if (fieldName == 'Feeder_Pillar_Quantity__c') {
            schemeItem.numberOfFeeder = value;
            if (schemeItem.numberOfFeeder > 0)
                schemeItem.showFeeder = true;
            else
                schemeItem.showFeeder = false;
        }
        else if (fieldName == 'Number_of_Master_Control_Systems__c') {
            schemeItem.numberOfMasterControl = value;
            if (schemeItem.numberOfMasterControl > 0)
                schemeItem.showMasterControl = true;
            else
                schemeItem.showMasterControl = false;
        }
        else if (fieldName == 'Number_of_Sub_Control_Systems__c') {
            schemeItem.numberOfSubControl = value;
            if (schemeItem.numberOfSubControl > 0)
                schemeItem.showSubControl = true;
            else
                schemeItem.showSubControl = false;
        }


        
            
    }


    calculateTotalSell(parentIndex) {

        console.log('this.managementUpLift '+this.managementUpLift);

        if (typeof parentIndex !== 'undefined') {
            let utilityItem = this._utilityItems.find(item => item.index == parentIndex);
            utilityItem.totalKitSell = 0;
            utilityItem.totalLabourSell = 0;
            utilityItem.totalPlantSell = 0;
            utilityItem.oppProducts.forEach(oppProduct => {
                let item = oppProduct.oppLineItem;
                item.Total_Sell_Rate_Wizard__c = 0;
                let totalKitSell = (item.Kit_Sell__c || 0) * (item.Quantity__c || 0);
                let totalLabourSell = (item.Labour_Sell__c || 0) * (item.Quantity__c || 0);
                let totalPlantSell = (item.Plant_Sell__c || 0) * (item.Quantity__c || 0);
                utilityItem.totalKitSell += (+totalKitSell);
                utilityItem.totalLabourSell += (+totalLabourSell);
                utilityItem.totalPlantSell += (+totalPlantSell);

                // Total Sell Rate (New Column)
                item.Total_Sell_Rate_Wizard__c = (((parseFloat(item.Labour_Sell__c) || 0) + (parseFloat(item.Kit_Sell__c) || 0) + (parseFloat(item.Plant_Sell__c) || 0)) * (1+(this.managementUpLift/100))) * (item.Quantity__c || 0);
            });

        }

        this.TotalKitSell = 0;
        this.TotalLabourSell = 0;
        //this.TotalMaterialSell = 0;
        this.TotalPlantSell = 0;
        this.TotalEstimationAmount = 0;
        this.TotalNoncontestableCosts = 0;
        this.TotalAssetValue = 0;
        this.SellPlusManagement = 0;

        this._utilityItems.forEach(utilityItem => {
            this.TotalKitSell += utilityItem.totalKitSell;
            this.TotalLabourSell += utilityItem.totalLabourSell;
            this.TotalPlantSell += utilityItem.totalPlantSell;
        });

        query({
            q: "SELECT Id, Margin_New__c,Subtotal_Non_Contestable_Cost__c,Total_Asset_Value__c,SellPlusManagement_custom__c,Total_Traffic_Management_New__c FROM Opportunity WHERE Id = '" + this.recordId + "'"
        })
            .then((result) => {
                if (result && typeof result[0].Margin_New__c != 'undefined') {
                    this.Margin = result[0].Margin_New__c / 100;
                }
                else
                    this.Margin = 0;

                if (result && typeof result[0].Subtotal_Non_Contestable_Cost__c != 'undefined') {
                    this.TotalNoncontestableCosts = result[0].Subtotal_Non_Contestable_Cost__c;
                }
                else
                    this.TotalNoncontestableCosts = 0;

                if (result && typeof result[0].Total_Asset_Value__c != 'undefined') {
                    this.TotalAssetValue = result[0].Total_Asset_Value__c;
                }
                else
                    this.TotalAssetValue = 0;

                if (result && typeof result[0].SellPlusManagement_custom__c != 'undefined') {
                    this.SellPlusManagement = result[0].SellPlusManagement_custom__c;
                }
                else
                    this.SellPlusManagement = 0;

                if (result && typeof result[0].Total_Traffic_Management_New__c != 'undefined') {
                    this.TotalTrafficManagement = result[0].Total_Traffic_Management_New__c;
                }
                else
                    this.TotalTrafficManagement = 0;


                this.TotalEstimationAmount = this.TotalKitSell + this.TotalLabourSell + this.TotalPlantSell + this.SellPlusManagement + this.TotalTrafficManagement + this.TotalNoncontestableCosts - this.TotalAssetValue;

            });


    }

    previous() {
        if (this.currentStep == '2') {
            this.firstPage = true;
            this.preDisabled = true;
            this.saveDisabled = false;
            this.currentStep = '1';
            this.template.querySelector('div.stepTwo').classList.add('slds-hide');
            this.template.querySelector('div.stepOne').classList.remove('slds-hide');
        }
        else if (this.currentStep == '3') {
            this.saveDisabled = true;
            this.currentStep = '2';
            this.template.querySelector('div.stepThree').classList.add('slds-hide');
            this.template.querySelector('div.stepTwo').classList.remove('slds-hide');
        }
        else if (this.currentStep == '4') {
            this.saveDisabled = true;
            this.currentStep = '3';
            this.template.querySelector('div.stepFour').classList.add('slds-hide');
            this.template.querySelector('div.stepThree').classList.remove('slds-hide');
        }
        else if (this.currentStep == '5') {
            this.lastPage = false;
            this.saveDisabled = true;
            this.currentStep = '4';
            this.template.querySelector('div.stepFive').classList.add('slds-hide');
            this.template.querySelector('div.stepFour').classList.remove('slds-hide');
        }
        else if (this.currentStep == '6') {
            this.lastPage = false;
            this.nextDisabled = false;
            this.saveDisabled = true;
            this.currentStep = '5';
            this.template.querySelector('div.stepSix').classList.add('slds-hide');
            this.template.querySelector('div.stepFive').classList.remove('slds-hide');
        }
        else if (this.currentStep == '7') {
            this.lastPage = false;
            this.nextDisabled = false;
            this.saveDisabled = false;
            this.currentStep = '6';
            this.template.querySelector('div.stepSeven').classList.add('slds-hide');
            this.template.querySelector('div.stepSix').classList.remove('slds-hide');
        }


    }

    next() {
        if (this.currentStep == '1') {
            this.firstPage = false;
            this.preDisabled = false;
            this.saveDisabled = true;
            this.currentStep = '2';
            this.template.querySelector('div.stepOne').classList.add('slds-hide');
            this.template.querySelector('div.stepTwo').classList.remove('slds-hide');
            this.initialCreateScheme();
        }
        else if (this.currentStep == '2') {
            this.saveDisabled = true;
            this.currentStep = '3';
            this.template.querySelector('div.stepTwo').classList.add('slds-hide');
            this.template.querySelector('div.stepThree').classList.remove('slds-hide');

            this.queryDefaultProducts(true);
        }
        else if (this.currentStep == '3') {
            this.saveDisabled = true;
            this.currentStep = '4';
            this.template.querySelector('div.stepThree').classList.add('slds-hide');
            this.template.querySelector('div.stepFour').classList.remove('slds-hide');

        }
        else if (this.currentStep == '4') { // CheckList to Payment
            this.template.querySelector('c-quote-checklist').saveItemsAndNext();
        }
        else if (this.currentStep == '5') { // Payment to PDF
            this.template.querySelector('c-quote-payment-schedule').saveItemsAndNext();
        }
        else if (this.currentStep == '6') {
            this.lastPage = true;
            this.nextDisabled = true;
            this.saveDisabled = true;
            this.currentStep = '7';
            this.template.querySelector('div.stepSix').classList.add('slds-hide');
            this.template.querySelector('div.stepSeven').classList.remove('slds-hide');
        }

    }

    saveItemsCheckListSuccess() {
        console.log('saveItemsCheckListSuccess');
        this.saveDisabled = true;
        this.currentStep = '5';
        this.template.querySelector('div.stepFour').classList.add('slds-hide');
        this.template.querySelector('div.stepFive').classList.remove('slds-hide');
        this.template.querySelector('c-quote-payment-schedule').resetItems();
    }

    saveItemsPaymentSuccess() {
        console.log('saveItemsPaymentSuccess');
        this.saveDisabled = false;
        this.currentStep = '6';
        this.template.querySelector('div.stepFive').classList.add('slds-hide');
        this.template.querySelector('div.stepSix').classList.remove('slds-hide');
        this.template.querySelector('c-quote-p-d-f-editor').renderPDF();
    }



    getNumberOfAvailableRules() {
        console.log('getNumberOfAvailableRules');
        //this.selectedRuleParentIndex = event.target.dataset.parentindex;
        //let utilityType = event.target.dataset.utilitytype;
        //this.selectedRuleUtilityType = utilityType;
        //console.log('parentIndex: ' + this.selectedRuleParentIndex);
        console.log(this.selectedUtilityList);
        //var selectedUtilityList = ['Electric', 'Water', 'Gas'];
        getrelatedRules({
            oppId: this.recordId,
            selectedUtilityList: this.selectedUtilityList
        })
            .then((results) => {
                console.log(results);

                //this.noOfAvailableRules = results.length;
            })
            .catch((error) => {
                console.error("getNumberOfAvailableRules error", JSON.stringify(error));

            });
    }



    openSelectUtilityTypeModal(event) {

        this.showSelectUtilityTypeModal = true;
    }

    closeSSelectUtilityTypeModal(event) {
        this.showSelectUtilityTypeModal = false;

    }

    openSelectRuleModal(event) {
        console.log('openSelectRuleModal');
        this.selectedRuleParentIndex = event.target.dataset.parentindex;
        let utilityType = event.target.dataset.utilitytype;
        this.selectedRuleUtilityType = utilityType;
        console.log('utilityType: ' + utilityType);
        console.log('parentIndex: ' + this.selectedRuleParentIndex);
        this.currentRuleUtility = utilityType;

        let utilityItem = this._utilityItems.find(item => item.utilityType == utilityType);
        console.log(JSON.parse(JSON.stringify(utilityItem.rules)));
        //console.log(utilityItem.rules);
        this.data = [];
        utilityItem.rules.forEach(item => {
            console.log(item);
            if(item.schemeItem) item.rule.ruleSchemeItemId = item.rule.Id + item.schemeItem.Id;
            else item.rule.ruleSchemeItemId = item.rule.Id;
            console.log('item.rule.ruleSchemeItemId '+item.rule.ruleSchemeItemId);
            this.data.push(item.rule);
        });
        //this.data = utilityItem.rules;
        if(utilityItem.selectedRuleIds)
            this.selectedRows = utilityItem.selectedRuleIds;
        else
            this.selectedRows = [];

        this.showSelectRuleModal = true;
    }

    saveRule(event) {
        this.showSpinner = true;
        let parentindex = event.target.dataset.parentindex;

        let utilityItem = this._utilityItems.find(item => item.index == parentindex);
        utilityItem.selectedRuleIds = this.selectedRows;

        getCoreProductsByRules({
            oppId: this.recordId,
            utilityType: this.selectedRuleUtilityType,
            selectedRuleSchemeItemIds: this.newSelectedRules,
            rules: utilityItem.rules
        })
            .then((results) => {
                console.log(results);

                if (results && results.length !== 0) {

                    //let utilityItem = this._utilityItems.find(item => item.index == parentindex);
                    utilityItem.noOfSeletcedRules = this.selectedRows.length;
                    let index = utilityItem.oppProducts.length;
                    console.log(utilityItem.oppProducts);

                    results.forEach(result => {
                        let calMaterialSell = 0;
                        let oppProduct = {};
                        oppProduct.oppLineItem = {};
                        let item = result.oppLineItem;
                        console.log(item.Product2Id__r.Id);

                        oppProduct.productUrl = '/' + item.Product2Id__r.Id;
                        oppProduct.index = index++;
                        oppProduct.isNew = false;
                        oppProduct.errors = [];
                        oppProduct.selection = {
                            id: item.Product2Id__r.Id,
                            sObjectType: 'Product2',
                            icon: 'standard:product',
                            title: item.Product2Id__r.Name,
                            subtitle: item.Product2Id__r.Name
                        }

                        oppProduct.isRemoveable = true;
                        oppProduct.oppLineItem.Implementor__c = item.Implementor__c;
                        //oppProduct.oppLineItem.Material_Cost__c = item.Material_Cost__c;

                        oppProduct.oppLineItem = item;
                        oppProduct.oppLineItem.Load_Source__c = 'Rule';
                        oppProduct.oppLineItem.Quantity__c = Math.ceil(item.Quantity__c);

                        console.log('Math.ceil ' + Math.ceil(item.Quantity__c));

                        if (typeof item.Product2Id__r.Material_Cost__c == 'undefined') item.Product2Id__r.Material_Cost__c = 0;
                        if (this.materialUpLift > 0)
                            calMaterialSell = item.Product2Id__r.Material_Cost__c + (item.Product2Id__r.Material_Cost__c * this.materialUpLift / 100);
                        else
                            calMaterialSell = item.Product2Id__r.Material_Cost__c;
                        oppProduct.oppLineItem.Kit_Sell__c = parseFloat(calMaterialSell).toFixed(2);

                        if (typeof item.Product2Id__r.Plant_Sell__c == 'undefined') oppProduct.oppLineItem.Plant_Sell__c = 0;
                        else oppProduct.oppLineItem.Plant_Sell__c = item.Product2Id__r.Plant_Sell__c;

                        if (typeof item.Product2Id__r.Labour_Sell__c == 'undefined') oppProduct.oppLineItem.Labour_Sell__c = 0;
                        else oppProduct.oppLineItem.Labour_Sell__c = item.Product2Id__r.Labour_Sell__c;

                        oppProduct.oppLineItem.Material_Cost__c = item.Material_Cost__c;
                        oppProduct.oppLineItem.Plant_Cost__c = item.Plant_Cost__c;
                        oppProduct.oppLineItem.Labour_Cost__c = item.Labour_Cost__c;

                        console.log(oppProduct);
                        utilityItem.oppProducts.push(oppProduct);
                        this.showSpinner = false;
                    });

                    this.calculateTotalSell(parentindex);


                }

                this.showSpinner = false;
            })
            .catch(error => {
                console.log('Error in query: ' + JSON.stringify(error));
                this.showSpinner = false;
            });

        this.showSelectRuleModal = false;
    }

    closeSelectRuleModal(event) {
        this.showSelectRuleModal = false;
        this.productToDeleteParentIndex = null;
    }



    openDeleteProductModal(event) {
        this.showDeleteProductModal = true;
        this.productToDeleteId = event.target.dataset.id;
        this.productToDeleteIndex = event.target.dataset.index;
        this.productToDeleteParentIndex = event.target.dataset.parentindex;
        this.deletetype = event.target.dataset.deletetype;
    }

    closeDeleteProductModal(event) {
        this.showDeleteProductModal = false;
        this.productToDeleteId = null;
        this.productToDeleteIndex = null;
        this.productToDeleteParentIndex = null;
    }

    @track isModalOpen = true;
    closeModal() {
        // to close modal set isModalOpen tarck value as false
        const closeQA = new CustomEvent('close');
        this.dispatchEvent(closeQA);
    }

    deleteProduct(event) {
        console.log('deleteProduct');
        this.showDeleteProductModal = false;
        this.productToDeleteId = null;
        this.productToDeleteIndex = null;
        this.productToDeleteParentIndex = null;
        console.log(event.target.dataset.deletetype);
        console.log(event.target.dataset.index);
        console.log(event.target.dataset.id);

        if(event.target.dataset.deletetype == 'DeletePerUtility') {
            let parentIndex = event.target.dataset.parentindex;
            let utilityItem = this._utilityItems.find(item => item.index == parentIndex);
            
            utilityItem.oppProducts.forEach(oppProductItem => {
                let item = oppProductItem.oppLineItem;
                if(item.Id){
                    this.removedItems.push({ Id: item.Id });
                }
            });
            
            utilityItem.oppProducts = [];
            utilityItem.noOfSeletcedRules = 0;
            utilityItem.selectedRuleIds = [];
            this.saveUtilityProducts();
            this.calculateTotalSell(parentIndex);
            
        }
        else if(event.target.dataset.deletetype == 'DeleteAllProducts')
        {
            this._utilityItems.forEach(utilityItem => {
                
                utilityItem.oppProducts.forEach(oppProductItem => {
                    
                    let item = oppProductItem.oppLineItem;
                    if(item.Id){
                        this.removedItems.push({ Id: item.Id });
                    }

                });

                utilityItem.oppProducts = [];
                utilityItem.noOfSeletcedRules = 0;
                utilityItem.selectedRuleIds = [];
                utilityItem.totalKitSell = 0;
                utilityItem.totalLabourSell = 0;
                utilityItem.totalPlantSell = 0;
            });
            this.TotalEstimationAmount = 0;
            this.saveUtilityProducts();
        }
        else 
        {
            if (event.target.dataset.id) {
                this.removedItems.push({ Id: event.target.dataset.id });
            }
            let parentIndex = event.target.dataset.parentindex;
            let index = event.target.dataset.index;
            console.log('parentIndex: ' + parentIndex);
            console.log('index: ' + index);
            let utilityItem = this._utilityItems.find(item => item.index == parentIndex);
            utilityItem.oppProducts.splice(index, 1);
            let newIndex = 0;
            utilityItem.oppProducts.forEach(item => {
                item.index = newIndex++;
            });
        }


        this.calculateTotalSell(parentIndex);
        //utilityItem.oppProducts.push.apply(utilityItem.oppProducts, this.getDefaultProducts(coupledItem.oppProducts));
    }

    removeProduct(event) {
        console.log('removeProduct');
        let parentIndex = event.target.dataset.parentindex;
        let index = event.target.dataset.index;
        let utilityType = event.target.dataset.utilitytype;
        console.log('parentIndex: ' + parentIndex);
        console.log('index: ' + index);

        let utilityItem = this._utilityItems.find(item => item.index == parentIndex);
        utilityItem.oppProducts.splice(event.target.dataset.index, 1);
        let newIndex = 0;
        utilityItem.oppProducts.forEach(item => {
            item.index = newIndex++;
            //this.template.querySelector('c-lookup[data-index="' + item.index + '"]').handleClearSelection();
        });

        this.calculateTotalSell(parentIndex);
    }

    generatePDFDoc(event) {
        //console.log(event.detail.blob);
        this.blob = event.detail.blob;

        var reader = new FileReader();
        reader.readAsDataURL(this.blob);
        reader.onload = () => {
            //console.log(base64data);
            var base64 = reader.result.split(',')[1]
            this.pdfBase64Data = base64;
            //console.log(this.pdfBase64Data);

        }
    }

    save(event) {
        let close = event.target.dataset.close;
        this.showSpinner = true;

        event.preventDefault();       // stop the form from submitting
        if (this.currentStep == 1) {
            const fields = event.detail.fields;
            this.template.querySelector('lightning-record-edit-form').submit(fields);
        }
        else if (this.currentStep != 1 && this.currentStep != 2) {
            console.log('saveUtilityProducts');
            let allValid = [...this.template.querySelectorAll('lightning-input')]
                .reduce((validSoFar, inputCmp) => {
                    inputCmp.reportValidity();
                    return validSoFar && inputCmp.checkValidity();
                }, true);

            if (allValid) {
                let utilityProducts = [];
                let plantSellItems = [];
                let labourSellItems = [];

                this._utilityItems.forEach(utilityItem => {
                    console.log(utilityItem);
                    let utilityProduct = {};

                    utilityProduct.oppProducts = [];
                    utilityItem.oppProducts.forEach(oppProductItem => {
                        console.log(oppProductItem);
                        let item = oppProductItem.oppLineItem;
                        if (item.Product2Id__r.Id) {
                            let oppProduct = {}
                            oppProduct.oppLineItem = {};

                            if (typeof item.Id != 'undefined') oppProduct.oppLineItem.Id = item.Id;
                            oppProduct.oppLineItem.Quantity__c = parseFloat(item.Quantity__c);
                            oppProduct.oppLineItem.Product2Id__c = item.Product2Id__r.Id;
                            oppProduct.oppLineItem.OpportunityId__c = item.OpportunityId__c;
                            oppProduct.oppLineItem.UnitPrice__c = parseFloat(item.Kit_Sell__c);
                            oppProduct.oppLineItem.Kit_Sell__c = parseFloat(item.Kit_Sell__c);
                            //oppProduct.oppLineItem.Material_Sell__c = parseFloat(item.Material_Sell__c);
                            //oppProduct.oppLineItem.Plant_Sell__c = parseFloat(item.Plant_Sell__c);
                            oppProduct.oppLineItem.Material_Cost__c = parseFloat(item.Material_Cost__c);
                            oppProduct.oppLineItem.Plant_Cost__c = parseFloat(item.Plant_Cost__c);
                            oppProduct.oppLineItem.Implementor__c = item.Implementor__c;

                            /*if (oppProductItem.isNew)
                            {
                                oppProduct.oppLineItem.Product2Id = item.Product2Id;
                                oppProduct.oppLineItem.OpportunityId = item.OpportunityId;
                            }
                            else
                            {
                                oppProduct.oppLineItem.Id = item.Id;
                            }*/

                            utilityProduct.oppProducts.push(oppProduct);
                            console.log(utilityProduct);
                        }
                    });
                    utilityProducts.push(utilityProduct);
                    console.log(utilityProducts);

                });

                console.log(this.pdfBase64Data);

                let myBlobString = '';

                if (typeof this.blob != 'undefined') {
                    myBlobString = '';
                }

                createEstimate({
                    oppId: this.recordId,
                    pdfBase64Data: this.pdfBase64Data
                })
                    .then(result => {
                        if (result && result.length !== 0) {
                            console.log(result);
                            this._quoteId = result.quoteId;
                            this._contentVersionId = result.contentVersionId;
                            this._contentDocumentId = result.contentDocumentId;
                            this.showSpinner = false;

                            if (close == 'true') {
                                const closeQA = new CustomEvent('close');
                                this.dispatchEvent(closeQA);

                                this[NavigationMixin.Navigate]({
                                    type: 'standard__recordPage',
                                    attributes: {
                                        recordId: this.quoteId,
                                        actionName: 'view',
                                    },
                                });
                            }
                            else {
                                try {
                                    let lookups = this.template.querySelectorAll('c-lookup');
                                    for (var i = 0; i < lookups.length; i++) {
                                        lookups[i].handleClearSelection();
                                    }
                                }
                                catch (e) {
                                    console.log(e);
                                }

                                this.dispatchEvent(
                                    new ShowToastEvent({
                                        title: 'Success',
                                        message: 'Estimate has been created successfully',
                                        variant: 'Success',
                                    }),
                                );


                                //this.template.querySelector('c-lookup[data-index="' + 4 + '"]').handleClearSelection();
                                //this.queryDefaultProducts(false);
                                //this.removedItems = [];

                            }
                        }
                    })
                    .catch(error => {
                        console.log('Error in save: ' + JSON.stringify(error));
                        let errorMessage = (error && error.body && error.body.pageErrors && error.body.pageErrors[0] && error.body.pageErrors[0].message) || '';
                        const event = new ShowToastEvent({
                            title: 'Error',
                            variant: 'error',
                            message: error.body,
                        });
                        this.dispatchEvent(event);
                        this.showSpinner = false;
                    });
            }
            else {
                this.showSpinner = false;
            }
        }
        else {
            this.showSpinner = false;
        }

        if (close == 'true') {
            this.closeWindow = true;
        }

    }

    breakdownupdated(event) {
        console.log('BreakdownUpdated');
        console.log(event.detail);   //Here the value is shown as undefined     
    }

    handleSubmitScheme(event) {
        event.preventDefault();       // stop the form from submitting
        let utilityType = event.target.dataset.utilitytype;
        let selectedUtility = event.target.dataset.selectedutility;
        var ruleId, recordTypeId;

        this.schemeItems.forEach(item => {
            if (item.utilityType === selectedUtility) {
                ruleId = item.ruleId;
                recordTypeId = item.utilityRecordTypeId;
            }
        });

        const inputFields = this.template.querySelectorAll(
            'lightning-input-field[data-utilitytype="' + utilityType + '"]'
        );
        if (inputFields) {
            inputFields.forEach(item => {
                console.log(item.fieldName);
                console.log(item.value);
            });

            console.log(inputFields);

            const recordInput = { apiName: 'Site_Scheme__c', fields: inputFields };
            createRecord(recordInput)
                .then(scheme => {
                    //this.accountId = account.id;
                    console.log(scheme.id);

                    /*const inputFields = this.template.querySelectorAll(
                        'lightning-input-field[data-utilityType="' + utilityType + '"]'
                    );*/

                    /*if (inputFields) {
                        inputFields.forEach(field => {
                            if (field.name != "Estimate__c" && field.name != "Site__c" && field.name != "Project__c") {
                                //field.reset();
                                field.value = null;
                                console.log(field.name + ' not reset');
                            }
                            else {
                                console.log(field.name + ' not reset');
                            }
                        });
    
                        let lookups = this.template.querySelectorAll('c-lookup');
                        for (var i = 0; i < lookups.length; i++) {
                            lookups[i].handleClearSelection();
                        }
                    }*/


                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Success',
                            message: "Scheme has been created",
                            variant: 'success',
                        }),
                    );
                })
                .catch(error => {
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Error creating record',
                            message: error.body.message,
                            variant: 'error',
                        }),
                    );
                });

        }

        //this.template.querySelector('lightning-record-edit-form').submit(test);
    }

    handleSuccessCreateScheme(event) {
        /*const inputFields = this.template.querySelectorAll(
            'lightning-input-field'
        );
        if (inputFields) {
            inputFields.forEach(field => {
                if (field.name != "Estimate__c" && field.name != "Site__c" && field.name != "Project__c") {
                    field.reset();
                    field.value = null;
                    console.log(field.name + ' not reset');
                }
                else {
                    console.log(field.name + ' not reset');
                }
            });
        }*/

        let recordTypeName;
        let utilityType;
        query({
            q: "SELECT Id, RecordTypeId, RecordType.Name FROM Site_Scheme__c WHERE Id = '" + event.detail.id + "'"
        })
            .then((result) => {
                if (result && result.length !== 0) {
                    console.log(result);
                    if (result[0].RecordType.Name == 'Charger') recordTypeName = 'Charge Points';
                    else if (result[0].RecordType.Name == 'StreetLighting') recordTypeName = 'Street Lighting';
                    else recordTypeName = result[0].RecordType.Name;
                    console.log(recordTypeName);

                    let item = this.schemeItems.find(item => item.utilityType == recordTypeName);
                    console.log(item);
                    item.recordId = event.detail.id;

                    const evt = new ShowToastEvent({
                        title: "Success",
                        message: recordTypeName + " scheme has been created/updated",
                        variant: "success"
                    });
                    this.dispatchEvent(evt);
                }
            });
    }

    handleSuccessUpdateOpp(event) {
        //const updatedRecordId = event.detail.id;
        // Generate a URL to a User record page
        console.log('============== Record Id', event.detail.id);
        //console.log('============== Selected Utility', JSON.stringify(event.detail));

        const event1 = new ShowToastEvent({
            variant: 'success',
            title: 'Success',
            message: 'Opportunity has been updated.',
        });
        this.dispatchEvent(event1);
        this.showSpinner = false;

        if (this.closeWindow == true) {
            const closeQA = new CustomEvent('close');
            this.dispatchEvent(closeQA);
        }

    }

    handleSelectionChange(event) {
        let parentIndex = event.target.dataset.parentindex;
        let index = event.target.dataset.index;
        let utilityType = event.target.dataset.utilitytype;
        console.log('parentIndex: ' + parentIndex);
        console.log('index: ' + index);
        console.log(event.detail[0]);
        //let pricebook2Id = this.opportunity.data.fields.Pricebook2Id.value;

        let utilityItem = this._utilityItems.find(item => item.index == parentIndex);
        let oppProduct = utilityItem.oppProducts.find(item => item.index == index);
        let item = oppProduct.oppLineItem;

        {
            if (typeof event.detail[0] !== 'undefined') {

                item.Product2Id = event.detail[0];
                query({
                    q:
                        "SELECT Id, Name, Family, ProductCode, Implementor__c, Kit_Sell__c, Material_Sell__c, Plant_Sell__c, Labour_Sell__c, Material_Cost__c, Plant_Cost__c, Labour_Cost__c, Description FROM Product2 WHERE Id = '" +
                        item.Product2Id + "'"
                })
                    .then((result) => {
                        if (result && result.length !== 0) {
                            console.log(result);
                            result.map((i) => {
                                let calMaterialSell = 0;
                                if (typeof i.Material_Cost__c == 'undefined') i.Material_Cost__c = 0;
                                if (this.materialUpLift > 0)
                                    calMaterialSell = i.Material_Cost__c + (i.Material_Cost__c * this.materialUpLift / 100);
                                else
                                    calMaterialSell = i.Material_Cost__c;

                                let selected = {
                                    id: event.detail[0],
                                    sObjectType: 'Product2',
                                    icon: 'standard:product',
                                    title: i.Name,
                                    subtitle: i.Name
                                }

                                //item.Product2Id__r = {};
                                item.Product2Id__r.Id = event.detail[0];
                                item.Product2Id__r.ProductCode = i.ProductCode;
                                item.Quantity__c = 1;
                                item.Implementor__c = i.Implementor__c;
                                item.Product2Id__r.Family = i.Family;

                                /*if (utilityType == 'Electric') item.Product2Id__r.Family = 'Electricity';
                                else if (utilityType == 'Charge Points') product.oppLineItem.Product2Id__r.Family = 'Charge Point';
                                else item.Product2Id__r.Family = utilityType;*/
                                
                                item.Kit_Sell__c = parseFloat(calMaterialSell).toFixed(2);
                                item.Material_Sell__c = i.Material_Sell__c;
                                item.Labour_Sell__c = i.Labour_Sell__c;
                                item.Plant_Sell__c = i.Plant_Sell__c;
                                item.Material_Cost__c = i.Material_Cost__c;
                                item.Plant_Cost__c = i.Plant_Cost__c;
                                item.Labour_Cost__c = i.Labour_Cost__c;
                                item.selection = selected;


                            });
                            item.errors = [];
                            this.calculateTotalSell(parentIndex);
                        }
                    })
                    .catch((error) => {
                        console.log(JSON.stringify(error));
                        const event = new ShowToastEvent({
                            title: 'Error',
                            variant: 'error',
                            message: JSON.stringify(error),
                        });
                        this.dispatchEvent(event);
                    });

            }
            else {
                item.Kit_Sell__c = 0;
                item.Plant_Sell__c = 0;
                item.Labour_Sell__c = 0;
                item.Quantity__c = 1;
                item.Implementor__c = null;

                this.calculateTotalSell(parentIndex);
            }
        }
    }

    section = '';
    handleToggleSection(event) {
        this.activeSectionMessage = 'Open section name:  ' + event.detail.openSections;
    }

    handleSetActiveSectionC() {
        const accordion = this.template.querySelector('.example-accordion');
        accordion.activeSectionName = 'C';
    }

}