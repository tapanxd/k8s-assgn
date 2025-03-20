variable "gcp_credentials" {
  type = string
  description = "GCP credentials file name"
}

variable "gcp_project_id" {
  type = string
  description = "Project ID of GCP"
}

variable "gcp_region" {
  type = string
  description = "GCP region"
}

variable "gke_cluster_name" {
  type = string
  description = "GKE cluster name"
}

variable "gke_regional" {
  type = bool
  description = "Flag for set GKE for regional or zoneal"
}

variable "gke_zones_list" {
  type = list(string)
  description = "All the zones in which you want your GKE cluster"
}

variable "gke_vpc" {
  type = string
  description = "VPC of gke"
}

variable "gke_subnet" {
  type = string
  description = "Sub network for GKE"
}

variable "gke_node_pools_name" {
  type = string
  description = "GKE's node pool name"
}

variable "gke_service_account_name" {
  type = string
  description = "name of GKE's service account"
}