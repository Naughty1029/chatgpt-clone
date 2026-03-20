Rails.application.routes.draw do
  get "chats/index"
  get "up" => "rails/health#show", as: :rails_health_check
  root "chats#index"
end
