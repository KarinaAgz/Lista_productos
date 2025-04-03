sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/Fragment",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], (Controller, Fragment, JSONModel, MessageToast) => {
    "use strict";

    return Controller.extend("logaligroup.basculas.controller.Main", {
        onInit() {
        },



        onSelectionChange: function (oEvent) {
            var oTable = oEvent.getSource();
            var oSelectedItem = oTable.getSelectedItem();
            if (oSelectedItem) {
                var oContext = oSelectedItem.getBindingContext();
                var sProductID = oContext.getProperty("ProductID");

                this._loadDetails(sProductID);
            }
        },

        _loadDetails: function (sProductID) {
            var oModel = this.getView().getModel();
            var sPath = "/Products(" + sProductID + ")";

            oModel.read(sPath, {
                success: function (oData) {
                    var oDetailModel = new JSONModel(oData);
                    this.getView().setModel(oDetailModel, "detail");

                    if (!this._oDialog) {
                        Fragment.load({
                            name: "logaligroup.basculas.fragments.DetailDialog",
                            controller: this
                        }).then(function (oDialog) {
                            this._oDialog = oDialog;
                            this.getView().addDependent(this._oDialog);
                            this._oDialog.open();
                        }.bind(this));
                    } else {
                        this._oDialog.open();
                    }
                }.bind(this),
                error: function (oError) {
                    MessageToast.show("Error al cargar los detalles.");
                }
            });
        },

        onCloseDialog: function () {
            this._oDialog.close();
        }

    });
});