# plumber.R: Main Plumber API router for R Analytics
suppressPackageStartupMessages({
  library(plumber)
  library(jsonlite)
})

# Source module files
source("utils.R")
source("overview.R")
source("preprocessing.R")
source("eda.R")
source("clickstream.R")
source("purchase_patterns.R")
source("funnel.R")
source("segmentation.R")
source("conversion_prediction.R")
source("revenue_estimation.R")
source("time_series.R")
source("visual_studio.R")

#* @apiTitle Clickstream Analytics & ML Engine
#* @apiDescription R backend powering all calculations, aggregations, models and visualizations
#* @apiVersion 1.0.0

#* Enable CORS filter
#* @filter cors
function(req, res) {
  res$setHeader("Access-Control-Allow-Origin", "*")
  res$setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
  res$setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Session-Id")
  if (req$REQUEST_METHOD == "OPTIONS") {
    res$status <- 200
    return(list())
  }
  plumber::forward()
}

#* Health check
#* @get /health
#* @serializer unboxedJSON
function() {
  list(
    status = "ok",
    r_version = R.version.string,
    timestamp = as.character(Sys.time())
  )
}

#* Inspect dataset schema, preview, and mapping
#* @post /dataset/inspect
#* @serializer unboxedJSON
function(req, session_id = "") {
  sid <- ifelse(nchar(session_id) > 0, session_id, req$body$session_id)
  inspect_dataset(sid)
}

#* Save field mapping
#* @post /dataset/field-mapping
#* @serializer unboxedJSON
function(req, session_id = "") {
  body <- req$body
  sid <- ifelse(nchar(session_id) > 0, session_id, body$session_id)
  save_field_mapping(sid, body$mapping)
  list(status = "success", message = "Field mapping saved")
}

#* Run data preprocessing
#* @post /preprocessing/run
#* @serializer unboxedJSON
function(req, session_id = "") {
  body <- req$body
  sid <- ifelse(nchar(session_id) > 0, session_id, body$session_id)
  opts <- if (!is.null(body$options)) body$options else list()
  run_preprocessing(sid, opts)
}

#* Overview KPIs
#* @get /overview/kpis
#* @serializer unboxedJSON
function(session_id = "") {
  get_overview_kpis(session_id)
}

#* EDA Summary
#* @get /eda/summary
#* @serializer unboxedJSON
function(session_id = "") {
  get_eda_summary(session_id)
}

#* Clickstream Analysis
#* @get /clickstream/analysis
#* @serializer unboxedJSON
function(session_id = "") {
  get_clickstream_analysis(session_id)
}

#* Purchase Patterns
#* @get /purchase/patterns
#* @serializer unboxedJSON
function(session_id = "") {
  get_purchase_patterns(session_id)
}

#* Conversion Funnel Analysis
#* @post /funnel/analysis
#* @serializer unboxedJSON
function(req, session_id = "") {
  body <- req$body
  sid <- ifelse(nchar(session_id) > 0, session_id, body$session_id)
  stages <- if (!is.null(body$stages)) body$stages else NULL
  get_funnel_analysis(sid, stages)
}

#* Customer Segmentation (RFM + k-means)
#* @get /segmentation/run
#* @serializer unboxedJSON
function(session_id = "", k = 4) {
  get_customer_segmentation(session_id, k = as.integer(k))
}

#* Train Conversion Prediction Models
#* @post /conversion/train
#* @serializer unboxedJSON
function(req, session_id = "") {
  body <- req$body
  sid <- ifelse(nchar(session_id) > 0, session_id, body$session_id)
  inc_early <- if (!is.null(body$include_early_checkout)) as.logical(body$include_early_checkout) else FALSE
  inc_cust <- if (!is.null(body$include_customer_attr)) as.logical(body$include_customer_attr) else TRUE
  train_conversion_models(sid, include_early_checkout = inc_early, include_customer_attr = inc_cust)
}

#* Train Revenue Estimation Models
#* @post /revenue/train
#* @serializer unboxedJSON
function(req, session_id = "") {
  body <- req$body
  sid <- ifelse(nchar(session_id) > 0, session_id, body$session_id)
  inc_cart <- if (!is.null(body$include_first_cart_item)) as.logical(body$include_first_cart_item) else TRUE
  inc_cust <- if (!is.null(body$include_customer_attr)) as.logical(body$include_customer_attr) else TRUE
  train_revenue_models(sid, include_first_cart_item = inc_cart, include_customer_attr = inc_cust)
}

#* Time-Series Analysis & Forecast
#* @get /timeseries/analysis
#* @serializer unboxedJSON
function(session_id = "", metric = "revenue", interval = "daily", forecast_periods = 14) {
  get_time_series_data(session_id, metric = metric, interval = interval, forecast_periods = as.integer(forecast_periods))
}

#* Visual Analytics Studio Dynamic Query
#* @post /studio/query
#* @serializer unboxedJSON
function(req, session_id = "") {
  body <- req$body
  sid <- ifelse(nchar(session_id) > 0, session_id, body$session_id)
  config <- if (!is.null(body$config)) body$config else body
  query_visual_studio(sid, config)
}

#* Save Visual Studio Config
#* @post /studio/save-config
#* @serializer unboxedJSON
function(req, session_id = "") {
  body <- req$body
  sid <- ifelse(nchar(session_id) > 0, session_id, body$session_id)
  save_studio_config(sid, body$config)
}

#* Get Visual Studio Configs
#* @get /studio/configs
#* @serializer unboxedJSON
function(session_id = "") {
  get_studio_configs(session_id)
}
