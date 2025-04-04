sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/Fragment",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/Sorter",
    "sap/ui/export/Spreadsheet"
], function (Controller, Fragment, JSONModel, MessageToast, Filter, FilterOperator,Sorter,Spreadsheet) {
    "use strict";

    return Controller.extend("logaligroup.basculas.controller.Main", {
        onInit: function () {
            // Inicialización vacía por ahora
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
                    oData.discontinuedText = oData.Discontinued ? "Discontinuado" : "Activo";
                    oData.discontinuedState = oData.Discontinued ? "Error" : "Success";
                    oData.stockState = oData.UnitsInStock < 10 ? "Warning" : "Success";
                    oData.summaryText = (oData.Discontinued && oData.UnitsInStock < 10) ? "Crítico" : "Normal";
                    oData.summaryState = (oData.Discontinued && oData.UnitsInStock < 10) ? "Error" : "Success";
        
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
                        }.bind(this)).catch(function (oError) {
                            MessageToast.show("Error al cargar el diálogo: " + oError.message);
                        });
                    } else {
                        this._oDialog.open();
                    }
                }.bind(this),
                error: function (oError) {
                    MessageToast.show("Error al cargar los detalles: " + oError.message);
                }
            });
        },

        onCloseDialog: function () {
            this._oDialog.close();
        },

        onFilter: function (oEvent) {
            var oTable = this.byId("productsTable");
            oTable.setBusy(true);
        
            var sQuery = this.byId("searchField").getValue();
            var sPrice = this.byId("priceFilter").getValue();
            var sStock = this.byId("stockFilter").getValue();
            var sDiscontinued = this.byId("discontinuedFilter").getSelectedKey();
        
            var aFilters = [];
            if (sQuery) {
                aFilters.push(new Filter("ProductName", FilterOperator.Contains, sQuery));
            }
            if (sPrice) {
                aFilters.push(new Filter("UnitPrice", FilterOperator.LE, parseFloat(sPrice) || 0));
            }
            if (sStock) {
                aFilters.push(new Filter("UnitsInStock", FilterOperator.GE, parseInt(sStock) || 0));
            }
            if (sDiscontinued !== "all") {
                var bDiscontinued = sDiscontinued === "discontinued";
                aFilters.push(new Filter("Discontinued", FilterOperator.EQ, bDiscontinued));
            }
        
            var oBinding = oTable.getBinding("items");
            oBinding.filter(aFilters);
        
            oBinding.attachEventOnce("dataReceived", function () {
                oTable.setBusy(false);
            });
        
           
        },
        
        onClearFilters: function () {
            this.byId("searchField").setValue("");
            this.byId("priceFilter").setValue("");
            this.byId("stockFilter").setValue("");
            this.byId("discontinuedFilter").setSelectedKey("all");
            var oTable = this.byId("productsTable");
            var oBinding = oTable.getBinding("items");
            oBinding.filter([]);
        },
        onSort: function (oEvent) {
            var oTable = this.byId("productsTable");
            var oBinding = oTable.getBinding("items");
            var sPath = oEvent.getParameter("column").getSortProperty();
            var bDescending = oEvent.getParameter("sortOrder") === "Descending";

            var oSorter = new Sorter(sPath, bDescending);
            oBinding.sort(oSorter);
        },
        onRefresh: function () {
            var oTable = this.byId("productsTable");
            var oBinding = oTable.getBinding("items");
            oTable.setBusy(true);
            oBinding.refresh(true);
            oBinding.attachEventOnce("dataReceived", function () {
                oTable.setBusy(false);
                MessageToast.show("Datos actualizados.");
            });
        },
        onExport: function () {
            var oTable = this.byId("productsTable");
            var oBinding = oTable.getBinding("items");
            var aItems = oBinding.getContexts().map(function (oContext) {
                return oContext.getObject();
            });

            var oSheet = new Spreadsheet({
                workbook: {
                    columns: [
                        { label: "ID del Producto", property: "ProductID", type: "Number" },
                        { label: "Nombre del Producto", property: "ProductName" },
                        { label: "Precio Unitario", property: "UnitPrice", type: "Number" },
                        { label: "Unidades en Stock", property: "UnitsInStock", type: "Number" },
                        { label: "ID de Categoría", property: "CategoryID", type: "Number" }
                    ]
                },
                dataSource: aItems,
                fileName: "Reporte_Productos.xlsx"
            });

            oSheet.build().finally(function () {
                oSheet.destroy();
            });
        }
    });
});